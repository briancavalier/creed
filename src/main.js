import { isFulfilled, isRejected, isSettled, isPending, isNever, getValue, getReason } from './inspect'
import { Future, resolve, reject, future, never, fulfill, all, race, iterablePromise, taskQueue } from './Promise'

import _delay from './delay'
import _timeout from './timeout'

import Any from './Any'
import Merge from './Merge'
import Settle from './Settle'
import { resultsArray } from './iterable'

import _runPromise from './runPromise'
import _runNode from './node'
import _runCoroutine from './coroutine.js'

// -------------------------------------------------------------
// ## Core promise methods
// -------------------------------------------------------------

export {
	resolve, reject, future, never, fulfill, all, race,
	isFulfilled, isRejected, isSettled, isPending, isNever,
	getValue, getReason
}

// -------------------------------------------------------------
// ## Coroutine
// -------------------------------------------------------------

// coroutine :: Generator e a -> (...* -> Promise e a)
// Make a coroutine from a promise-yielding generator
export function coroutine (generator) {
	return function (...args) {
		return runGenerator(generator, this, args)
	}
}

function runGenerator (generator, thisArg, args) {
	const iterator = generator.apply(thisArg, args)
	return _runCoroutine(resolve, iterator, new Future())
}

// -------------------------------------------------------------
// ## Node-style async
// -------------------------------------------------------------

// type Nodeback e a = e -> a -> ()
// type NodeApi e a = ...* -> Nodeback e a -> ()

// fromNode :: NodeApi e a -> (...args -> Promise e a)
// Turn a Node API into a promise API
export function fromNode (f) {
	return function (...args) {
		return runResolver(_runNode, f, this, args, new Future())
	}
}

// runNode :: NodeApi e a -> ...* -> Promise e a
// Run a Node API, returning a promise for the outcome
export function runNode (f, ...args) {
	return runResolver(_runNode, f, this, args, new Future())
}

// -------------------------------------------------------------
// ## Make a promise
// -------------------------------------------------------------

// type Resolve e a = a|Thenable e a -> ()
// type Reject e = e -> ()
// type Producer e a = (...* -> Resolve e a -> Reject e -> ())
// runPromise :: Producer e a -> ...* -> Promise e a
export function runPromise (f, ...args) {
	return runResolver(_runPromise, f, this, args, new Future())
}

function runResolver (run, f, thisArg, args, p) {
	checkFunction(f)

	try {
		run(f, thisArg, args, p)
	} catch (e) {
		p._reject(e)
	}

	return p
}

// -------------------------------------------------------------
// ## Time
// -------------------------------------------------------------

// delay :: number -> Promise e a -> Promise e a
export function delay (ms, x) {
	/* eslint complexity:[2,4] */
	const p = resolve(x)
	return ms <= 0 || isRejected(p) || isNever(p) ? p
		: _delay(ms, p, new Future())
}

// timeout :: number -> Promise e a -> Promise (e|TimeoutError) a
export function timeout (ms, x) {
	const p = resolve(x)
	return isSettled(p) ? p : _timeout(ms, p, new Future())
}

// -------------------------------------------------------------
// ## Iterables
// -------------------------------------------------------------

// any :: Iterable (Promise e a) -> Promise e a
export function any (promises) {
	return iterablePromise(new Any(), promises)
}

// settle :: Iterable (Promise e a) -> Promise e [Promise e a]
export function settle (promises) {
	const handler = new Settle(resolve, resultsArray(promises))
	return iterablePromise(handler, promises)
}

// -------------------------------------------------------------
// ## Lifting
// -------------------------------------------------------------

// merge :: (...* -> b) -> ...Promise e a -> Promise e b
export function merge (f, ...args) {
	return runMerge(f, this, args)
}

function runMerge (f, thisArg, args) {
	const handler = new Merge(new MergeHandler(f, thisArg), resultsArray(args))
	return iterablePromise(handler, args)
}

class MergeHandler {
	constructor (f, c) {
		this.f = f
		this.c = c
		this.promise = void 0
		this.args = void 0
	}

	merge (promise, args) {
		this.promise = promise
		this.args = args
		taskQueue.add(this)
	}

	run () {
		try {
			this.promise._resolve(this.f.apply(this.c, this.args))
		} catch (e) {
			this.promise._reject(e)
		}
	}
}

function checkFunction (f) {
	if (typeof f !== 'function') {
		throw new TypeError('must provide a resolver function')
	}
}

// -------------------------------------------------------------
// ## ES6 Promise polyfill
// -------------------------------------------------------------

const NOARGS = []

// type Resolve a = a -> ()
// type Reject e = e -> ()
// Promise :: (Resolve a -> Reject e) -> Promise e a
class CreedPromise extends Future {
	constructor (f) {
		super()
		runResolver(_runPromise, f, void 0, NOARGS, this)
	}
}

CreedPromise.resolve = resolve
CreedPromise.reject = reject
CreedPromise.all = all
CreedPromise.race = race

export function shim () {
	/* global self */
	const orig = typeof Promise === 'function' && Promise

	/* istanbul ignore if */
	if (typeof self !== 'undefined') {
		self.Promise = CreedPromise
		/* istanbul ignore else */
	} else if (typeof global !== 'undefined') {
		global.Promise = CreedPromise
	}

	return orig
}

export { CreedPromise as Promise }

/* istanbul ignore if */
if (typeof Promise !== 'function') {
	shim()
}
