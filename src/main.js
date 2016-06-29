// -------------------------------------------------------------
// ## Core promise methods
// -------------------------------------------------------------

/* eslint-disable no-duplicate-imports */
export { resolve, reject, future, never, fulfill } from './Promise'
import { Future, resolve, reject } from './Promise'
export { isFulfilled, isRejected, isSettled, isPending, isNever, getValue, getReason } from './inspect'
import { isRejected, isSettled, isNever } from './inspect'
export { all, race, any, settle, merge } from './combinators'
import { all, race } from './combinators'

export { default as CancelToken } from './CancelToken'

export { default as coroutine } from './coroutine.js'

import Action from './Action'

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
	return function promisified (...args) {
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
	if (token != null && token.requested) return token.getRejected()
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
		if (this.token != null) {
			if (this.token.requested) {
				this._resolve(this.token.getRejected())
				return
			}
			this.cancelAction = new Action(this)
			this.token._subscribe(this.cancelAction)
		}
		runResolver(_runPromise, f, void 0, NOARGS, this)
	}
	__become (p) {
		if (this.token != null && this.cancelAction != null) {
			this.token._unsubscribe(this.cancelAction) // TODO better solution
			this.cancelAction = null
		}
		super.__become(p)
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
