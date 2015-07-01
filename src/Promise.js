'use strict';
import Scheduler from './Scheduler';
import async from './async';
import registerRejection from './registerRejection';
import maybeThenable from './maybeThenable';
import silenceRejection from './silenceRejection';
import { makeRefTypes, isPending } from './refTypes';
import { PENDING, RESOLVED, FULFILLED, REJECTED, SETTLED, HANDLED } from './state';

import delay from './delay';

import resolveIterable from './iterable';
import All from './All';
import Any from './Any';
import Race from './Race';
import Merge from './Merge';

import runNode from './node';
import runCo from './co.js';

let taskQueue = new Scheduler(async);

let { handlerFor, handlerForMaybeThenable, Deferred, Fulfilled, Rejected, Async, Never }
    = makeRefTypes(isPromise, handlerForPromise, registerRejection, taskQueue);

//----------------------------------------------------------------
// Promise
//----------------------------------------------------------------

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

//----------------------------------------------------------------
// Creating promises
//----------------------------------------------------------------

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

let neverPromise = new Promise(new Never());

export function never() {
    return neverPromise;
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

//----------------------------------------------------------------
// Arrays & Iterables
//----------------------------------------------------------------

function iterableRef(handler, iterable) {
    return resolveIterable(handlerForMaybeThenable, handler, iterable, new Deferred());
}

export function all(promises) {
    checkIterable('all', promises);

    let n = countPending(promises);
    return new Promise(iterableRef(new All(n), promises));
}

export function race(promises) {
    checkIterable('race', promises);

    return new Promise(iterableRef(new Race(), promises));
}

export function any(promises) {
    checkIterable('any', promises);

    let n = countPending(promises);
    return new Promise(iterableRef(new Any(n), promises));
}

export function settle(promises) {
    checkIterable('settle', promises);

    let n = countPending(promises);
    return new Promise(iterableRef(new Settle(n), promises));
}

// TODO: Find a way to move this out to its own module
class Settle {
    constructor(n) {
        this.pending = n;
        this.results = new Array(n);
    }

    valueAt(ref, i, x) {
        return this.settleAt(ref, i, new Promise(new Fulfilled(x)));
    }

    fulfillAt(ref, i, h) {
        return this.settleAt(ref, i, new Promise(h));
    }

    rejectAt(ref, i, h) {
        silenceRejection(h);
        return this.settleAt(ref, i, new Promise(h));
    }

    settleAt(ref, i, state) {
        this.results[i] = state;
        if(--this.pending === 0 && isPending(ref)) {
            ref.fulfill(this.results);
        }
        return true;
    }
}

function countPending(promises) {
    if (Array.isArray(promises)) {
        return promises.length;
    }

    // TODO: Need a better solution
    // This will consume a generator iterator, and pretty much
    // make it useless.
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

//----------------------------------------------------------------
// Lifting
//----------------------------------------------------------------

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
    return iterableRef(new Merge(f, thisArg, args.length), args);
}

//----------------------------------------------------------------
// Convert node-style async
//----------------------------------------------------------------

// Node-style async function to promise-returning function
// (a -> (err -> value)) -> (a -> Promise)
export function denodeify(f) {
    return function(...args) {
        return new Promise(runNode(f, this, args, new Deferred()));
    };
}

//----------------------------------------------------------------
// Generators
//----------------------------------------------------------------

// Generator to coroutine
// Generator -> (a -> Promise)
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

//----------------------------------------------------------------
// ES6 Promise polyfill
//----------------------------------------------------------------

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
