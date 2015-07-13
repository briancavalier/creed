'use strict';
import TaskQueue from './TaskQueue';
import ErrorHandler from './ErrorHandler';
import makeRefTypes from './makeRefTypes';
import { isPending, isFulfilled, isRejected, isSettled } from './inspect';

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

let { refFor, refForNonPromise, refForMaybeThenable, refForObject, Deferred, Fulfilled, Rejected, Never }
    = makeRefTypes(isPromise, refForPromise, errorHandler, taskQueue);

// ## Promise

// Promise :: Promise e a
class Promise {
    constructor(ref) {
        this._ref = ref;
    }

    // then :: Promise e a -> (a -> b) -> (e -> e2) -> Promise b e2
    // Transform the value or handle the error of the promise
    then(f, r) {
        let ref = refForPromise(this);
        if((isFulfilled(ref) && typeof f !== 'function') ||
            (isRejected(ref) && typeof r !== 'function')) {
            return this;
        }

        return new Promise(then(f, r, ref, new Deferred()));
    }

    // catch :: Promise e a -> (e -> e2) -> Promise b e2
    // Handle a failed promise
    catch(r) {
        var ref = refForPromise(this);
        return isFulfilled(ref) ? this
            : new Promise(then(void 0, r, ref, new Deferred()));
    }

    // delay :: Promise e a -> number -> Promise e a
    delay(ms) {
        let ref = refForPromise(this);
        if(ms <= 0 || isRejected(ref)) {
            return this;
        }

        return new Promise(delay(ms, ref, new Deferred()));
    }

    // timeout :: Promise e a -> number -> Promise (e|TimeoutError) a
    timeout(ms) {
        var ref = refForPromise(this);
        return isSettled(ref) ? this
            : new Promise(timeout(ms, ref, new Deferred()));
    }

    toString() {
        let ref = refForPromise(this);
        return isSettled(ref) ? '[object Promise ' + ref.join().value + ']' : '[object Promise]';
    }
}

function isPromise(x) {
    return x instanceof Promise;
}

function refForPromise(p) {
    return p._ref;
}

// ## Creating promises

// resolve :: a -> Promise e a
// resolve :: Promise e a -> Promise e a
// resolve :: Thenable e a -> Promise e a
export function resolve(x) {
    return isPromise(x) ? x : new Promise(refForNonPromise(x));
}

// reject :: e -> Promise e a
export function reject(x) {
    return new Promise(new Rejected(x));
}

//const neverRef = new Never();
const NEVER = new Promise(Never);
NEVER.then  = never;
NEVER.delay = never;

// never :: () -> Promise e a
export function never() {
    return NEVER;
}

// promise :: ((a -> ()) -> (e -> ()) -> ()) -> resolve a
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

//----------------------------------------------------------------
// Arrays & Iterables
//----------------------------------------------------------------

// all :: Iterable (Promise e a) -> Promise e (Iterable a)
export function all(promises) {
    checkIterable('all', promises);
    return new Promise(iterableRef(new Merge(allHandler, resultsArray(promises)), promises));
}

const allHandler = {
    merge(ref, args) {
        ref.fulfill(args);
    }
};

export function race(promises) {
    checkIterable('race', promises);
    return new Promise(iterableRef(new Race(becomeNever), promises));
}

function becomeNever(deferred) {
    deferred.become(Never);
}

export function any(promises) {
    checkIterable('any', promises);
    return new Promise(iterableRef(new Any(), promises));
}

export function settle(promises) {
    checkIterable('settle', promises);
    return new Promise(iterableRef(new Settle(stateForValue, resultsArray(promises)), promises));
}

function stateForValue(x) {
    return new Fulfilled(x);
}

function iterableRef(handler, iterable) {
    return resolveIterable(refForMaybeThenable, handler, iterable, new Deferred());
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
    return new Promise(runMerge(f, thisArg, args));
}

function runMerge(f, thisArg, args) {
    return iterableRef(new Merge(new MergeHandler(f, thisArg), resultsArray(args)), args);
}

class MergeHandler {
    constructor(f, c) {
        this.f = f;
        this.c = c;
    }

    merge(ref, args) {
        try {
            ref.resolve(this.f.apply(this.c, args));
        } catch(e) {
            ref.reject(e);
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
        return new Promise(runNode(f, this, args, new Deferred()));
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
    var d = new Deferred();
    return new Promise(runCo(refFor, d, iterator));
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
