'use strict';

import TaskQueue from './TaskQueue';
import ErrorHandler from './ErrorHandler';
import makeEmitError from './emitError';
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
import { resolveIterable, resultsArray } from './iterable';

import runPromise from './runPromise';
import runNode from './node';
import runCo from './co.js';

let taskQueue = new TaskQueue();
let errorHandler = new ErrorHandler(makeEmitError(), e => {
    throw e.value;
});

let marker = {};

// -------------------------------------------------------------
// ## Types
// -------------------------------------------------------------

// Future :: Promise e a
// A promise that is pending initially, and whose value
// is provided later.
export class Future {
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
        return isSettled(n) ? n.then(f, r) : then(f, r, n, new Future());
    }

    // catch :: Promise e a -> (e -> b) -> Promise e b
    catch (r) {
        return this.then(void 0, r);
    }

    toString() {
        return '[object ' + this.inspect() + ']';
    }

    inspect() {
        let n = this.near();
        return isSettled(n) ? n.inspect() : 'Promise { pending }';
    }

    near() {
        if (!this._isResolved()) {
            return this;
        }

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

    state() {
        return this._isResolved() ? this.ref.near().state() : PENDING;
    }

    _isResolved() {
        return this.ref !== void 0;
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
Future.prototype._isPromise = marker;

// Fulfilled :: a -> Promise _ a
// A promise that has already acquired its value
class Fulfilled {
    constructor(x) {
        this.value = x;
    }

    then(f) {
        return then(f, void 0, this, new Future());
    }

    catch () {
        return this;
    }

    toString() {
        return '[object ' + this.inspect() + ']';
    }

    inspect() {
        return 'Promise { fulfilled: ' + this.value + ' }';
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
        return then(void 0, r, this, new Future());
    }

    toString() {
        return '[object ' + this.inspect() + ']';
    }

    inspect() {
        return 'Promise { rejected: ' + this.value + ' }';
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
        return '[object ' + this.inspect() + ']';
    }

    inspect() {
        return 'Promise { never }';
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

export function promise(f, ...args) {
    return runResolver(f, this, args, new Future());
}

function runResolver(f, thisArg, args, p) {
    checkFunction(f);

    try {
        runPromise(f, thisArg, args, p);
    } catch (e) {
        p._reject(e);
    }
    return p;
}

// delay :: number -> Promise e a -> Promise e a
export function delay(ms, x) {
    let p = resolve(x);
    return ms <= 0 || isRejected(p) || isNever(p) ? p : _delay(ms, p, new Future());
}

// timeout :: Promise e a -> number -> Promise (e|TimeoutError) a
export function timeout(ms, x) {
    var p = resolve(x);
    return isSettled(p) ? p : _timeout(ms, p, new Future());
}

// -------------------------------------------------------------
// ## Iterables
// -------------------------------------------------------------

// all :: Iterable (Promise e a) -> Promise e (Iterable a)
export function all(promises) {
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
    return iterablePromise(new Race(never), promises);
}

// any :: Iterable (Promise e a) -> Promise e a
export function any(promises) {
    return iterablePromise(new Any(), promises);
}

// settle :: Iterable (Promise e a) -> Promise e (Iterable Promise e a)
export function settle(promises) {
    let handler = new Settle(resolve, resultsArray(promises));
    return iterablePromise(handler, promises);
}

function isIterable(x) {
    return typeof x === 'object' && x !== null;
}

function iterablePromise(handler, iterable) {
    if (!isIterable(iterable)) {
        return reject(new TypeError('expected an iterable'));
    }

    let p = new Future();
    return resolveIterable(resolveMaybeThenable, handler, iterable, p);
}

// -------------------------------------------------------------
// ## Lifting
// -------------------------------------------------------------

// merge :: (...a -> b) -> ...Promise e a -> Promise e b
export function merge(f, ...args) {
    return runMerge(f, this, args);
}

function runMerge(f, thisArg, args) {
    let handler = new Merge(new MergeHandler(f, thisArg), resultsArray(args));
    return iterablePromise(handler, args);
}

class MergeHandler {
    constructor(f, c) {
        this.f = f;
        this.c = c;
        this.promise = void 0;
        this.args = void 0;
    }

    merge(promise, args) {
        this.promise = promise;
        this.args = args;
        taskQueue.add(this);
    }

    run() {
        try {
            this.promise._resolve(this.f.apply(this.c, this.args));
        } catch (e) {
            this.promise._reject(e);
        }
    }
}

// -------------------------------------------------------------
// ## Convert node-style async
// -------------------------------------------------------------

// type Nodeback = (e -> value -> ())

// node :: (...a -> Nodeback) -> (...a -> Promise)
// Node-style async function to promise-returning function
export function node(f) {
    return function (...args) {
        return runNodeResolver(f, this, args, new Future());
    };
}

function runNodeResolver(f, thisArg, args, p) {
    checkFunction(f);

    try {
        runNode(f, thisArg, args, p);
    } catch (e) {
        p._reject(e);
    }
    return p;
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
    return runCo(resolve, iterator, new Future());
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
            ? extractThenable(then, x, new Future())
            : new Fulfilled(x);
    } catch (e) {
        return new Rejected(e);
    }
}

function extractThenable(then, thenable, p) {
    try {
        then.call(thenable, x => p._resolve(x), e => p._reject(e));
    } catch (e) {
        p._reject(e);
    }
    return p;
}

function cycle() {
    return new Rejected(new TypeError('resolution cycle'));
}

function checkFunction(f) {
    if (typeof f !== 'function') {
        throw new TypeError('must provide a resolver function');
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

const NOARGS = [];

// Promise :: ((a -> ()) -> (e -> ())) -> Promise e a
class CreedPromise extends Future {
    constructor(f) {
        super();
        runResolver(f, void 0, NOARGS, this);
    }
}

CreedPromise.resolve = resolve;
CreedPromise.reject  = reject;
CreedPromise.all     = all;
CreedPromise.race    = race;

export function installGlobal() {
    let orig = typeof Promise === 'function' && Promise;

    if (typeof self !== 'undefined') {
        self.Promise = CreedPromise;
    } else if (typeof global !== 'undefined') {
        global.Promise = CreedPromise;
    }

    return orig;
}

if (typeof Promise !== 'function') {
    installGlobal();
}

export { CreedPromise as Promise }

