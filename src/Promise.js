'use strict';

import TaskQueue from './TaskQueue';
import ErrorHandler from './ErrorHandler';
import makeEmitError from './emitError';
import maybeThenable from './maybeThenable';
import { PENDING, FULFILLED, REJECTED, NEVER } from './state';
import { isNever, isSettled } from './inspect';

import then from './then';
import _map from './map';
import _chain from './chain';

import Race from './Race';
import Merge from './Merge';
import { resolveIterable, resultsArray } from './iterable';

let taskQueue = new TaskQueue();
export { taskQueue };

let errorHandler = new ErrorHandler(makeEmitError(), e => {
    throw e.value;
});

// -------------------------------------------------------------
// ## Types
// -------------------------------------------------------------

// data Promise e a where
//   Future    :: Promise e a
//   Fulfilled :: a -> Promise e a
//   Rejected  :: Error e => e -> Promise e a
//   Never     :: Promise e a

// Future :: Promise e a
// A promise whose value cannot be known until some future time
export class Future {
    constructor() {
        this.ref = void 0;
        this.action = void 0;
        this.length = 0;
    }

    // empty :: Promise e a
    static empty() {
        return never();
    }

    // of :: a -> Promise e a
    static of(x) {
        return fulfill(x);
    }

    // then :: Promise e a -> (a -> b) -> Promise e b
    // then :: Promise e a -> () -> (e -> b) -> Promise e b
    // then :: Promise e a -> (a -> b) -> (e -> b) -> Promise e b
    then(f, r) {
        let n = this.near();
        return n === this ? then(f, r, n, new Future()) : n.then(f, r);
    }

    // catch :: Promise e a -> (e -> b) -> Promise e b
    catch (r) {
        let n = this.near();
        return n === this ? then(void 0, r, n, new Future()) : n.catch(r);
    }

    // map :: Promise e a -> (a -> b) -> Promise e b
    map(f) {
        let n = this.near();
        return n === this ? _map(f, n, new Future()) : n.map(f);
    }

    // ap :: Promise e (a -> b) -> Promise e a -> Promise e b
    ap(p) {
        let n = this.near();
        let pp = resolveThenable(p);
        return n === this ? this.chain(f => pp.map(f)) : n.ap(pp);
    }

    // chain :: Promise e a -> (a -> Promise e b) -> Promise e b
    chain(f) {
        let n = this.near();
        return n === this ? _chain(f, n, new Future()) : n.chain(f);
    }

    // concat :: Promise e a -> Promise e a -> Promise e a
    concat(b) {
        let n = this.near();
        let bp = resolveThenable(b);

        return n !== this ? n.concat(bp)
            : isNever(bp) ? n
            : isSettled(bp) ? bp
            : race([n, bp]);
    }

    // toString :: Promise e a -> String
    toString() {
        return '[object ' + this.inspect() + ']';
    }

    // inspect :: Promise e a -> String
    inspect() {
        let n = this.near();
        return n === this ? 'Promise { pending }' : n.inspect();
    }

    // near :: Promise e a -> Promise e a
    near() {
        if (!this._isResolved()) {
            return this;
        }

        this.ref = this.ref.near();
        return this.ref;
    }

    // state :: Promise e a -> Int
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
        this.ref = ref === this ? cycle() : ref;
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

// Fulfilled :: a -> Promise e a
// A promise whose value is already known
class Fulfilled {
    constructor(x) {
        this.value = x;
    }

    then(f) {
        return typeof f === 'function' ? then(f, void 0, this, new Future()) : this;
    }

    catch () {
        return this;
    }

    map(f) {
        return _map(f, this, new Future());
    }

    ap(p) {
        return resolveThenable(p).map(this.value);
    }

    chain(f) {
        return _chain(f, this, new Future());
    }

    concat() {
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

// Rejected :: Error e => e -> Promise e a
// A promise whose value cannot be known due to some reason/error
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

    map() {
        return this;
    }

    ap() {
        return this;
    }

    chain() {
        return this;
    }

    concat() {
        return this;
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

// Never :: Promise e a
// A promise that waits forever for its value to be known
class Never {
    then() {
        return this;
    }

    catch () {
        return this;
    }

    map() {
        return this;
    }

    ap() {
        return this;
    }

    chain() {
        return this;
    }

    concat(b) {
        return b;
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

Future.prototype.constructor =
Fulfilled.prototype.constructor =
Rejected.prototype.constructor =
Never.prototype.constructor = Future;

// -------------------------------------------------------------
// ## Creating promises
// -------------------------------------------------------------

// resolve :: Thenable e a -> Promise e a
// resolve :: a -> Promise e a
export function resolve(x) {
    return isPromise(x) ? x.near()
        : maybeThenable(x) ? refForMaybeThenable(fulfill, x)
        : new Fulfilled(x);
}

// reject :: e -> Promise e a
export function reject(e) {
    return new Rejected(e);
}

// never :: Promise e a
export function never() {
    return new Never();
}

// fulfill :: a -> Promise e a
export function fulfill(x) {
    return new Fulfilled(x);
}

// future :: () -> { resolve: Resolve e a, promise: Promise e a }
// type Resolve e a = a|Thenable e a -> ()
export function future() {
    let promise = new Future();
    return { resolve: x => promise._resolve(x), promise };
}

// -------------------------------------------------------------
// ## Iterables
// -------------------------------------------------------------

// all :: Iterable (Promise e a) -> Promise e [a]
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

function isIterable(x) {
    return typeof x === 'object' && x !== null;
}

export function iterablePromise(handler, iterable) {
    if (!isIterable(iterable)) {
        return reject(new TypeError('expected an iterable'));
    }

    let p = new Future();
    return resolveIterable(resolveMaybeThenable, handler, iterable, p);
}

// -------------------------------------------------------------
// # Internals
// -------------------------------------------------------------

// isPromise :: * -> boolean
function isPromise(x) {
    return x != null && typeof x === 'object' && x.constructor === Future;
}

function resolveMaybeThenable(x) {
    return isPromise(x) ? x.near() : refForMaybeThenable(fulfill, x);
}

function resolveThenable(x) {
    return isPromise(x) ? x.near() : refForMaybeThenable(reject, x);
}

function refForMaybeThenable(otherwise, x) {
    try {
        let then = x.then;
        return typeof then === 'function'
            ? extractThenable(then, x)
            : otherwise(x);
    } catch (e) {
        return new Rejected(e);
    }
}

function extractThenable(then, thenable) {
    let p = new Future();
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

class Continuation {
    constructor(action, ref) {
        this.action = action;
        this.ref = ref;
    }

    run() {
        this.ref._runAction(this.action);
    }
}
