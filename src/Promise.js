'use strict';

import TaskQueue from './TaskQueue';
import ErrorHandler from './ErrorHandler';
import maybeThenable from './maybeThenable';
import { PENDING, RESOLVED, FULFILLED, REJECTED } from './state';
import { silenceError, isFulfilled, isRejected, isSettled } from './inspect';

import then from './then';
import delay from './delay';
import timeout from './timeout';

import Any from './Any';
import Race from './Race';
import Merge from './Merge';
import Settle from './Settle';
import resolveIterable from './iterable';

import runNode from './node';
import runCo from './co.js';

let taskQueue = new TaskQueue();
let errorHandler = new ErrorHandler(r => { throw r.value });

let marker = {};

const PromiseProtocol = {
    then(f, r) {
        let n = this.near();
        if((isFulfilled(n) && typeof f !== 'function') ||
            (isRejected(n) && typeof r !== 'function')) {
            return n;
        }

        return then(f, r, n, new Promise());
    },

    catch(r) {
        let n = this.near();
        if(isFulfilled(n)) {
            return n;
        }

        return then(void 0, r, n, new Promise());
    },

    // delay :: Promise e a -> number -> Promise e a
    delay(ms) {
        let n = this.near();
        if(ms <= 0 || isRejected(n)) {
            return this;
        }

        return delay(ms, n, new Promise());
    },

    // timeout :: Promise e a -> number -> Promise (e|TimeoutError) a
    timeout(ms) {
        var n = this.near();
        return isSettled(n) ? this
            : timeout(ms, n, new Promise());
    },

    toString() {
        let n = this.near();
        return isSettled(n) ? '[object Promise ' + n.value + ']' : '[object Promise]';
    },

    near() {
        return this;
    },

    _isPromise: marker,

    _when(action) {
        taskQueue.add(new Continuation(action, this));
    }
};

class Promise {
    constructor() {
        this.ref = void 0;
        this.action = void 0;
        this.length = 0;
    }

    state() {
        return this._isResolved() ? this.ref.near().state() : PENDING;
    }

    _isResolved() {
        return this.ref !== void 0;
    }

    near() {
        return this._isResolved() ? this._near() : this;
    }

    _near() {
        let ref = this;

        while(ref.ref !== void 0) {
            ref = ref.ref;
            if(ref === this) {
                ref = cycle();
                break;
            }
        }

        return this.ref = ref;
    }

    _when(action) {
        this._runAction(action);
    }

    _runAction(action) {
        if(this.action === void 0) {
            this.action = action;
            if(this._isResolved()) {
                taskQueue.add(this);
            }
        } else {
            this[this.length++] = action;
        }
    }

    _resolve(x) {
        this._become(resolve(x));
    }

    _fulfill(x) {
        this._become(new Fulfilled(x));
    }

    _reject(e) {
        if(this._isResolved()) {
            return;
        }

        this.__become(new Rejected(e));
    }

    _become(ref) {
        if(this._isResolved()) {
            return;
        }

        this.__become(ref);
    }

    __become(ref) {
        this.ref = ref;
        if(this.action !== void 0) {
            taskQueue.add(this);
        }
    }

    run() {
        let ref = this.ref.near();
        ref._runAction(this.action);
        this.action = void 0;

        for (let i = 0; i < this.length; ++i) {
            ref._runAction(this[i]);
            this[i] = void 0;
        }

        this.length = 0;
    }
}

mixin(Promise.prototype, PromiseProtocol);

class Fulfilled {
    constructor(x) {
        this.value = x;
    }

    state() {
        return FULFILLED;
    }

    _runAction(action) {
        action.fulfilled(this);
    }
}

mixin(Fulfilled.prototype, PromiseProtocol);

class Rejected {
    constructor(e) {
        this.value = e;
        errorHandler.track(this);
    }

    state() {
        return REJECTED;
    }

    _runAction(action) {
        if(action.rejected(this)) {
            errorHandler.untrack(this);
        }
    }
}

mixin(Rejected.prototype, PromiseProtocol);

class Never {
    state() {
        return PENDING;
    }

    _runAction() {}

    _when() {}

    then() {
        return this;
    }

    catch() {
        return this;
    }

    delay() {
        return this;
    }

    toString() {
        return '[object Never]';
    }
}

mixin(Never.prototype, PromiseProtocol);

class Continuation {
    constructor(action, ref) {
        this.action = action;
        this.ref = ref;
    }

    run() {
        this.ref._runAction(this.action);
    }
}

export function resolve(x) {
    return isPromise(x) ? x.near() : refForNonPromise(x);
}

export function reject(e) {
    return new Rejected(e);
}

export function never() {
    return new Never();
}

// promise :: ((a -> ()) -> (e -> ()) -> ()) -> resolve a
export function promise(f) {
    let p = new Promise();
    runResolver(f, p);
    return p;
}

function runResolver(f, p) {
    try {
        f(x => p._resolve(x), e => p._reject(e));
    } catch (e) {
        p._reject(e);
    }
}

//----------------------------------------------------------------
// Iterables
//----------------------------------------------------------------

// all :: Iterable (Promise e a) -> Promise e (Iterable a)
export function all(promises) {
    checkIterable('all', promises);
    return iterablePromise(new Merge(allHandler, resultsArray(promises)), promises);
}

const allHandler = {
    merge(ref, args) {
        ref._fulfill(args);
    }
};

export function race(promises) {
    checkIterable('race', promises);
    return iterablePromise(new Race(never), promises);
}

export function any(promises) {
    checkIterable('any', promises);
    return iterablePromise(new Any(), promises);
}

export function settle(promises) {
    checkIterable('settle', promises);
    return iterablePromise(new Settle(stateForValue, resultsArray(promises)), promises);
}

function stateForValue(x) {
    return new Fulfilled(x);
}

function iterablePromise(handler, iterable) {
    return resolveIterable(refForMaybeThenable, handler, iterable, new Promise());
}

function checkIterable(kind, x) {
    if(typeof x !== 'object' || x === null) {
        throw new TypeError('non-iterable passed to ' + kind);
    }
}

function resultsArray(iterable) {
    return Array.isArray(iterable) ? new Array(iterable.length) : [];
}

//----------------------------------------------------------------
// Lifting
//----------------------------------------------------------------

// lift :: (a -> b) -> (Promise a -> Promise b)
export function lift(f) {
    return function(...args) {
        return applyp(f, this, args);
    }
}

// merge :: (a -> b) -> Promise a -> Promise b
export function merge(f, ...args) {
    return applyp(f, this, args);
}

function applyp(f, thisArg, args) {
    return runMerge(f, thisArg, args);
}

function runMerge(f, thisArg, args) {
    return iterablePromise(new Merge(new MergeHandler(f, thisArg), resultsArray(args)), args);
}

class MergeHandler {
    constructor(f, c) {
        this.f = f;
        this.c = c;
    }

    merge(promise, args) {
        try {
            promise._resolve(this.f.apply(this.c, args));
        } catch(e) {
            promise._reject(e);
        }
    }
}

//----------------------------------------------------------------
// Convert node-style async
//----------------------------------------------------------------

// Node-style async function to promise-returning function
// (...a -> (err -> value)) -> (a -> Promise)
export function denodeify(f) {
    return function(...args) {
        return runNode(f, this, args, new Promise());
    };
}

//----------------------------------------------------------------
// Generators
//----------------------------------------------------------------

// Generator to coroutine
// Generator -> (...a -> Promise)
export function co(generator) {
    return function(...args) {
        return runGenerator(generator, this, args);
    };
}

function runGenerator(generator, thisArg, args) {
    var iterator = generator.apply(thisArg, args);
    return runCo(resolve, iterator, new Promise());
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
                super();
                runResolver(f, this);
            }
        };

        Promise.resolve = resolve;
        Promise.reject  = reject;
        Promise.all     = all;
        Promise.race    = race;
    }

}(Promise, runResolver, resolve, reject, all, race));

function isPromise(x) {
    return x !== null && typeof x === 'object' && x._isPromise === marker;//promises.has(x);
}

function refForNonPromise(x) {
    return maybeThenable(x) ? refForUntrusted(x) : new Fulfilled(x);
}

function refForMaybeThenable(x) {
    return isPromise(x) ? x.near() : refForUntrusted(x)
}

function refForUntrusted(x) {
    try {
        let then = x.then;
        return typeof then === 'function' ? extractThenable(then, x) : new Fulfilled(x);
    } catch(e) {
        return new Rejected(e);
    }
}

function extractThenable(then, thenable) {
    let d = new Promise();
    try {
        then.call(thenable, x => d._resolve(x), e => d._reject(e));
    } catch (e) {
        d._reject(e);
    }

    return d;
}

function cycle() {
    return new Rejected(new TypeError('resolution cycle'));
}

function mixin(t, s) {
    return Object.keys(s).reduce((t, k) => {
        if(!(k in t)) {
            t[k] = s[k];
        }
        return t;
    }, t);
}
