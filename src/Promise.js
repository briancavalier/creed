'use strict';

import TaskQueue from './TaskQueue';
import ErrorHandler from './ErrorHandler';
import maybeThenable from './maybeThenable';
import { PENDING, FULFILLED, REJECTED, NEVER } from './state';
import { silenceError, isFulfilled, isRejected, isSettled, isPending, isNever } from './inspect';
export { isFulfilled, isRejected, isSettled, isPending, isNever };

import then from './then';
import _delay from './delay';
import _timeout from './timeout';

import Any from './Any';
import Race from './Race';
import Merge from './Merge';
import Settle from './Settle';
import { checkIterable, resolveIterable, resultsArray } from './iterable';

import runNode from './node';
import runCo from './co.js';

let taskQueue = new TaskQueue();
let errorHandler = new ErrorHandler();

let marker = {};

// -------------------------------------------------------------
// ## Types
// -------------------------------------------------------------

// Promise :: Promise e a
// A promise that is pending initially, and fulfills or fails
// at some time after being created.
export class Promise {
    constructor() {
        this.ref = void 0;
        this.action = void 0;
        this.length = 0;
    }

    // then :: Promise e a -> (a -> b) -> Promise e b
    // then :: Promise e a -> () -> (e -> b) -> Promise e b
    // then :: Promise e a -> (a -> b) -> (e -> b) -> Promise e b
    then(f, r) {
        let n = this.near();
        return n === this ? then(f, r, n, new Promise()) : n.then(f, r);
    }

    // catch :: Promise e a -> (e -> b) -> Promise e b
    catch (r) {
        return this.then(void 0, r);
    }

    toString() {
        let n = this.near();
        return n === this ? '[object Promise]' : n.toString();
    }

    near() {
        return this._isResolved() ? this._near() : this;
    }

    state() {
        return this._isResolved() ? this.ref.near().state() : PENDING;
    }

    _isResolved() {
        return this.ref !== void 0;
    }

    _near() {
        let ref = this;

        while (ref.ref !== void 0) {
            ref = ref.ref;
            if (ref === this) {
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
        if (this.action === void 0) {
            this.action = action;
            if (this._isResolved()) {
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
        if (this._isResolved()) {
            return;
        }

        this.__become(new Rejected(e));
    }

    _become(ref) {
        if (this._isResolved()) {
            return;
        }

        this.__become(ref);
    }

    __become(ref) {
        this.ref = ref;
        if (this.action !== void 0) {
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
Promise.prototype._isPromise = marker;

// Fulfilled :: a -> Promise _ a
// A promise that has already acquired its value
class Fulfilled {
    constructor(x) {
        this.value = x;
    }

    then(f) {
        return then(f, void 0, this, new Promise());
    }

    catch () {
        return this;
    }

    toString() {
        return '[object Promise ' + this.value + ']';
    }

    state() {
        return FULFILLED;
    }

    near() {
        return this;
    }

    _when(action) {
        taskQueue.add(new Continuation(action, this));
    }

    _runAction(action) {
        action.fulfilled(this);
    }
}
Fulfilled.prototype._isPromise = marker;

// Rejected :: e -> Promise e _
// A promise that is known to have failed to acquire its value
class Rejected {
    constructor(e) {
        this.value = e;
        this._state = REJECTED;
        errorHandler.track(this);
    }

    then(_, r) {
        return typeof r === 'function' ? this.catch(r) : this;
    }

    catch (r) {
        return then(void 0, r, this, new Promise());
    }

    toString() {
        return '[object Promise ' + this.value + ']';
    }

    state() {
        return this._state;
    }

    near() {
        return this;
    }

    _when(action) {
        taskQueue.add(new Continuation(action, this));
    }

    _runAction(action) {
        if (action.rejected(this)) {
            errorHandler.untrack(this);
        }
    }
}
Rejected.prototype._isPromise = marker;

// Never :: Promise _ _
// A promise that will never acquire its value nor fail
class Never {
    then() {
        return this;
    }

    catch () {
        return this;
    }

    toString() {
        return '[object Never]';
    }

    state() {
        return PENDING | NEVER;
    }

    near() {
        return this;
    }

    _when() {}

    _runAction() {}
}
Never.prototype._isPromise = marker;

// -------------------------------------------------------------
// ## Creating promises
// -------------------------------------------------------------

// resolve :: Promise e a -> Promise e a
// resolve :: Thenable e a -> Promise e a
// resolve :: a -> Promise e a
export function resolve(x) {
    if (isPromise(x)) {
        return x.near();
    }

    return maybeThenable(x) ? refForUntrusted(x) : new Fulfilled(x);
}

// reject :: e -> Promise e a
export function reject(e) {
    return new Rejected(e);
}

// never :: Never
export function never() {
    return new Never();
}

// delay :: Promise e a -> number -> Promise e a
export function delay(ms, x) {
    let p = resolve(x);
    return ms <= 0 || isRejected(p) ? p : _delay(ms, p, new Promise());
}

// timeout :: Promise e a -> number -> Promise (e|TimeoutError) a
export function timeout(ms, x) {
    var p = resolve(x);
    return isSettled(p) ? p : _timeout(ms, p, new Promise());
}

// -------------------------------------------------------------
// ## Iterables
// -------------------------------------------------------------

// all :: Iterable (Promise e a) -> Promise e (Iterable a)
export function all(promises) {
    checkIterable('all', promises);
    let handler = new Merge(allHandler, resultsArray(promises));
    return iterablePromise(handler, promises);
}

const allHandler = {
    merge(ref, args) {
        ref._fulfill(args);
    }
};

// race :: Iterable (Promise e a) -> Promise e a
export function race(promises) {
    checkIterable('race', promises);
    return iterablePromise(new Race(never), promises);
}

// any :: Iterable (Promise e a) -> Promise e a
export function any(promises) {
    checkIterable('any', promises);
    return iterablePromise(new Any(), promises);
}

// settle :: Iterable (Promise e a) -> Promise e (Iterable Promise e a)
export function settle(promises) {
    checkIterable('settle', promises);
    let handler = new Settle(resolve, resultsArray(promises));
    return iterablePromise(handler, promises);
}

function iterablePromise(handler, iterable) {
    let p = new Promise();
    return resolveIterable(resolveMaybeThenable, handler, iterable, p);
}

// -------------------------------------------------------------
// ## Lifting
// -------------------------------------------------------------

// lift :: (...a -> b) -> (...Promise e a -> Promise e b)
export function lift(f) {
    return function (...args) {
        return applyp(f, this, args);
    };
}

// merge :: (...a -> b) -> ...Promise e a -> Promise e b
export function merge(f, ...args) {
    return applyp(f, this, args);
}

function applyp(f, thisArg, args) {
    return runMerge(f, thisArg, args);
}

function runMerge(f, thisArg, args) {
    let handler = new Merge(new MergeHandler(f, thisArg), resultsArray(args));
    return iterablePromise(handler, args);
}

class MergeHandler {
    constructor(f, c) {
        this.f = f;
        this.c = c;
    }

    merge(promise, args) {
        try {
            promise._resolve(this.f.apply(this.c, args));
        } catch (e) {
            promise._reject(e);
        }
    }
}

// -------------------------------------------------------------
// ## Convert node-style async
// -------------------------------------------------------------

// type Nodeback = (e -> value -> ())

// denodify :: (...a -> Nodeback) -> (a -> Promise)
// Node-style async function to promise-returning function
export function denodeify(f) {
    return function (...args) {
        return runNode(f, this, args, new Promise());
    };
}

// -------------------------------------------------------------
// ## Generators
// -------------------------------------------------------------

// co :: Generator -> (...a -> Promise)
// Generator to coroutine
export function co(generator) {
    return function (...args) {
        return runGenerator(generator, this, args);
    };
}

function runGenerator(generator, thisArg, args) {
    var iterator = generator.apply(thisArg, args);
    return runCo(resolve, iterator, new Promise());
}

// -------------------------------------------------------------
// # Internals
// -------------------------------------------------------------

// isPromise :: a -> boolean
function isPromise(x) {
    return x !== null && typeof x === 'object' && x._isPromise === marker;
}

function resolveMaybeThenable(x) {
    return isPromise(x) ? x.near() : refForUntrusted(x);
}

function refForUntrusted(x) {
    try {
        let then = x.then;
        return typeof then === 'function'
            ? extractThenable(then, x)
            : new Fulfilled(x);
    } catch (e) {
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

function runResolver(f, p) {
    try {
        f(x => p._resolve(x), e => p._reject(e));
    } catch (e) {
        p._reject(e);
    }
}

class Continuation {
    constructor(action, ref) {
        this.action = action;
        this.ref = ref;
    }

    run() {
        this.ref._runAction(this.action);
    }
}

// -------------------------------------------------------------
// ## ES6 Promise polyfill
// -------------------------------------------------------------

var g;
if (typeof self !== 'undefined') {
    g = self;
} else if (typeof global !== 'undefined') {
    g = global;
}

if (g !== void 0 && typeof g.Promise !== 'function') {
    g.Promise = class CreedPromise extends Promise {
        constructor(f) {
            super();
            runResolver(f, this);
        }
    };

    g.Promise.resolve = resolve;
    g.Promise.reject  = reject;
    g.Promise.all     = all;
    g.Promise.race    = race;
}
