'use strict';
import Scheduler from './Scheduler';
import async from './async';
import createHandlers from './handlers';
import registerRejection from './registerRejection';
import maybeThenable from './maybeThenable';
import { PENDING, RESOLVED, FULFILLED, REJECTED, SETTLED, HANDLED } from './state';

import delay from './delay';

let taskQueue = new Scheduler(async);

let { handlerFor, handlerForMaybeThenable, Deferred, Fulfilled, Rejected, Async, Never }
    = createHandlers(isPromise, handlerForPromise, registerRejection, taskQueue);

class Promise {
    constructor(handler) {
        this._handler = handler;
    }

    then(f, r) {
        let handler = then(Deferred, f, r, handlerForPromise(this));
        return new this.constructor(handler);
    }

    catch(r) {
        return this.then(null, r);
    }

    delay(ms) {
        let handler = delay(ms, handlerForPromise(this), new Deferred());
        return new this.constructor(handler);
    }
}

function isPromise(x) {
    return x instanceof Promise;
}

function handlerForPromise(p) {
    return p._handler;
}

function then(Deferred, f, r, h) {
    let s = h.state();

    if(((s & FULFILLED) > 0 && typeof f !== 'function') ||
        ((s & REJECTED) > 0 && typeof r !== 'function')) {
        return h;
    }

    let d = new Deferred();
    h.when(new Then(f, r, d));
    return d;
}

class Then {
    constructor(f, r, next) {
        this.f = f;
        this.r = r;
        this.next = next;
    }

    fulfilled(handler) {
        return runThen(this.f, handler, this.next);
    }

    rejected(handler) {
        return runThen(this.r, handler, this.next);
    }
}

function runThen(f, handler, next) {
    if(typeof f !== 'function') {
        next.become(handler);
        return false;
    }

    tryMapNext(f, handler.value, next);
    return true;
}

function tryMapNext(f, x, next) {
    try {
        next.resolve(f(x));
    } catch(e) {
        next.reject(e);
    }
}

export function promise(f) {
    return new Promise(runResolver(f));
}

function runResolver(f) {
    let h = new Deferred();

    try {
        f(x => h.resolve(x), e => h.reject(e));
    } catch (e) {
        h.reject(e);
    }

    return h;
}

export function resolve(x) {
    if (isPromise(x)) {
        return x;
    }

    let h = handlerFor(x);
    return new Promise((h.state() & PENDING) > 0 ? h : new Async(h));
}

export function reject(x) {
    return new Promise(new Async(new Rejected(x)));
}

let neverPromise = new Promise(new Never());

export function never() {
    return neverPromise;
}

import createIterable from './iterable';
let Iterable = createIterable(handlerForMaybeThenable, Deferred, Fulfilled);

export function all(promises) {
    checkIterable('all', promises);

    var n = countPending(promises);
    let a = new All(n, new Array(n));
    return new Promise(new Iterable(a, promises))
}

class All {
    constructor(n, results) {
        this.pending = n;
        this.results = results;
    }

    ignored(_, i, h) {
        silenceRejection(h);
    }

    fulfilled(iterable, i, h) {
        this.results[i] = h.value;
        if(--this.pending === 0 && iterable.isPending()) {
            iterable.fulfill(this.results);
        }
        return true;
    }

    rejected(iterable, i, h) {
        iterable.become(h);
        return false;
    }
}

export function race(promises) {
    checkIterable('race', promises);

    return new Promise(new Iterable(new Race(), promises));
}

class Race {
    ignored(_, i, h) {
        silenceRejection(h);
    }

    fulfilled(iterable, i, h) {
        iterable.become(h);
        return true;
    }

    rejected(iterable, i, h) {
        iterable.become(h);
        return false;
    }
}

export function settle(promises) {
    checkIterable('settle', promises);

    let n = countPending(promises);
    let s = new Settle(n, new Array(n));
    return new Promise(new Iterable(s, promises));
}

class Settle {
    constructor(n, results) {
        this.pending = n;
        this.results = results;
    }

    ignored() {}

    fulfilled(iterable, i, h) {
        return this.settleAt(iterable, i, new Promise(h));
    }

    rejected(iterable, i, h) {
        silenceRejection(h);
        return this.settleAt(iterable, i, new Promise(h));
    }

    settleAt(iterable, i, state) {
        this.results[i] = state;
        if(--this.pending === 0 && iterable.isPending()) {
            iterable.fulfill(this.results);
        }
        return true;
    }
}

function countPending(promises) {
    if (Array.isArray(promises)) {
        return promises.length;
    }

    let i = 0;
    for(let _ of promises) {
        ++i;
    }
    return i;
}

function checkIterable(kind, x) {
    if(typeof x !== 'object' || x === null) {
        throw new TypeError('non-iterable passed to ' + kind);
    }
}

function silenceRejection(h) {
    (h.state() & FULFILLED) === 0 && h.when(rejectionSilencer);
}

const rejectionSilencer = { rejected: always, fulfilled: always };

function always() {
    return true;
}

// (a -> b) -> (Promise a -> Promise b)
export function lift(f) {
    return function(...args) {
        return applyp(f, this, args);
    }
}

// (a -> b) -> Promise a -> Promise b
export function merge(f, ...args) {
    return applyp(f, this, args);
}

function applyp(f, thisArg, args) {
    return new Promise(runMerge(f, thisArg, args));
}

function runMerge(f, thisArg, args) {
    let n = args.length;
    let m = new Merge(f, thisArg, n, new Array(n));
    return new Iterable(m, args);
}

class Merge {
    constructor(f, c, n, results) {
        this.f = f;
        this.c = c;
        this.pending = n;
        this.results = results;
    }

    ignored(_, i, h) {
        silenceRejection(h);
    }

    fulfilled(iterable, i, h) {
        this.results[i] = h.value;
        if(--this.pending === 0 && iterable.isPending()) {
            this.merge(this.f, this.c, this.results, iterable);
        }
        return true;
    }

    rejected(iterable, i, h) {
        iterable.become(h);
        return false;
    }

    merge(f, c, args, iterable) {
        try {
            iterable.resolve(f.apply(c, args));
        } catch(e) {
            iterable.reject(e);
        }
    }
}

// Node-style async function to promise-returning function
// (a -> (err -> value)) -> (a -> Promise)
import runNode from './node';

export function denodeify(f) {
    return function(...args) {
        return new Promise(runNode(f, this, args, new Deferred()));
    };
}

// Generator to coroutine
// Generator -> (a -> Promise)
import runCo from './co.js';

export function co(generator) {
    return function(...args) {
        return runGenerator(generator, this, args);
    };
}

function runGenerator(generator, thisArg, args) {
    var iterator = generator.apply(thisArg, args);
    var d = new Deferred();
    return new Promise(runCo(handlerFor, d, iterator));
}

(function(TruthPromise, runResolver, resolve, reject, all, race) {

    var g;
    if(typeof self !== 'undefined') {
        g = self;
    } else if(typeof global !== 'undefined') {
        g = global;
    } else {
        return;
    }

    if(typeof g.Promise !== 'function') {
        g.Promise = class Promise extends TruthPromise {
            constructor(f) {
                super(runResolver(f));
            }
        };

        Promise.resolve = resolve;
        Promise.reject  = reject;
        Promise.all     = all;
        Promise.race    = race;
    }

}(Promise, runResolver, resolve, reject, all, race));
