// -------------------------------------------------------------
// ## Core promise methods
// -------------------------------------------------------------

/* eslint-disable no-duplicate-imports */
export { resolve, reject, future, never, fulfill } from './Promise'
import { Future, resolve, reject, makeResolvers } from './Promise'
export { isFulfilled, isRejected, isCancelled, isSettled, isPending, isNever, getValue, getReason } from './inspect'
import { isRejected, isSettled, isNever } from './inspect'
export { all, race, any, settle, merge } from './combinators'
import { all, race } from './combinators'

export { default as CancelToken } from './CancelToken'

export { default as coroutine } from './coroutine.js'

import _delay from './delay'
import _timeout from './timeout'

import _runPromise from './runPromise'
import _runNode from './node'

// -------------------------------------------------------------
// ## Node-style async
// -------------------------------------------------------------

// type Nodeback e a = e -> a -> ()
// type NodeApi e a = ...* -> Nodeback e a -> ()

// fromNode :: NodeApi e a -> (...args -> Promise e a)
// Turn a Node API into a promise API
export function fromNode (f) {
	checkFunction(f)
	return function promisified (...args) {
		return runNodeFunction(f, this, args)
	}
}

// runNode :: NodeApi e a -> ...* -> Promise e a
// Run a Node API, returning a promise for the outcome
export function runNode (f, ...args) {
	checkFunction(f)
	return runNodeFunction(f, this, args)
}

function runNodeFunction (f, thisArg, args) {
	const p = new Future()

	try {
		_runNode(f, thisArg, args, p)
	} catch (e) {
		p._reject(e)
	}

	return p
}
// -------------------------------------------------------------
// ## Make a promise
// -------------------------------------------------------------

// type Resolve e a = a|Thenable e a -> ()
// type Reject e = e -> ()
// type Producer e a = (...* -> Resolve e a -> Reject e -> ())
// runPromise :: Producer e a -> ...* -> Promise e a
export function runPromise (f, ...args) {
	checkFunction(f)
	return runResolver(f, this, args, new Future())
}

function runResolver (f, thisArg, args, p) {
	const resolvers = makeResolvers(p)

	try {
		_runPromise(f, thisArg, args, resolvers)
	} catch (e) {
		resolvers.reject(e)
	}

	return p
}

function checkFunction (f) {
	if (typeof f !== 'function') {
		throw new TypeError('must provide a resolver function')
	}
}

// -------------------------------------------------------------
// ## Time
// -------------------------------------------------------------

// delay :: number -> Promise e a -> Promise e a
export function delay (ms, x, token) {
	/* eslint complexity:[2,5] */
	if (token != null && token.requested) return token.getCancelled()
	const p = resolve(x)
	if (ms <= 0) return p
	if (token == null && (isRejected(p) || isNever(p))) return p
	return _delay(ms, p, new Future(token))
}

// timeout :: number -> Promise e a -> Promise (e|TimeoutError) a
export function timeout (ms, x) {
	const p = resolve(x)
	return isSettled(p) ? p : _timeout(ms, p, new Future())
}

// -------------------------------------------------------------
// ## ES6 Promise polyfill
// -------------------------------------------------------------

const NOARGS = []

// type Resolve a = a -> ()
// type Reject e = e -> ()
// Promise :: (Resolve a -> Reject e -> ()) -> Promise e a
class CreedPromise extends Future {
	constructor (f, token) {
		super(token)
		if (!this._isResolved()) { // test for cancellation
			runResolver(f, void 0, NOARGS, this)
		}
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
