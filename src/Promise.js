import { isObject } from './util'
import { PENDING, FULFILLED, REJECTED, NEVER, HANDLED } from './state'
import { isRejected, isNever, isSettled } from './inspect'

import { TaskQueue, Continuation } from './TaskQueue'
import ErrorHandler from './ErrorHandler'
import emitError from './emitError'

import Action from './Action'
import then from './then'
import map from './map'
import chain from './chain'

import CancelToken from './CancelToken'

import { race } from './combinators'

export const taskQueue = new TaskQueue()

/* istanbul ignore next */
const errorHandler = new ErrorHandler(emitError, e => {
	throw e.value
})

// -------------------------------------------------------------
// ## Types
// -------------------------------------------------------------

// Internal base type to hold fantasy-land static constructors
class Core {
	// empty :: Promise e a
	static empty () {
		return never()
	}

	// of :: a -> Promise e a
	static of (x) {
		return fulfill(x)
	}
}

// data Promise e a where
//   Future    :: Promise e a
//   Fulfilled :: a -> Promise e a
//   Rejected  :: Error e => e -> Promise e a
//   Never     :: Promise e a

// Future :: Promise e a
// A promise whose value cannot be known until some future time
export class Future extends Core {
	constructor (token) {
		super()
		this.ref = void 0
		this.action = void 0
		this.token = token != null ? CancelToken.from(token) : null
		this.length = 0
	}

	// then :: Promise e a -> (a -> b) -> Promise e b
	// then :: Promise e a -> () -> (e -> b) -> Promise e b
	// then :: Promise e a -> (a -> b) -> (e -> b) -> Promise e b
	then (f, r, token) {
		const n = this.near()
		return n === this ? then(f, r, n, new Future(token)) : n.then(f, r, token)
	}

	// catch :: Promise e a -> (e -> b) -> Promise e b
	catch (r, token) {
		const n = this.near()
		return n === this ? then(void 0, r, n, new Future(token)) : n.catch(r, token)
	}

	// map :: Promise e a -> (a -> b) -> Promise e b
	map (f, token) {
		const n = this.near()
		return n === this ? map(f, n, new Future(token)) : n.map(f, token)
	}

	// ap :: Promise e (a -> b) -> Promise e a -> Promise e b
	ap (p, token) {
		const n = this.near()
		const pp = p.near()
		return n === this ? this.chain(f => pp.map(f, token), token) : n.ap(pp, token)
	}

	// chain :: Promise e a -> (a -> Promise e b) -> Promise e b
	chain (f, token) {
		const n = this.near()
		return n === this ? chain(f, n, new Future(token)) : n.chain(f, token)
	}

	// concat :: Promise e a -> Promise e a -> Promise e a
	concat (b) {
		/* eslint complexity:[2,5] */
		const n = this.near()
		const bp = b.near()

		return isSettled(n) || isNever(bp) ? n
			: isSettled(bp) || isNever(n) ? bp
			: race([n, bp])
	}

	// untilCancel :: Promise e a -> CancelToken e -> Promise e a
	untilCancel (token) {
		/* eslint complexity:[2,5] */
		const n = this.near()
		if (n !== this) {
			return n.untilCancel(token)
		} else if (token == null || token === this.token) {
			return this
		}
		const p = new Future(token)
		if (p.token.requested) {
			return p.token.getRejected()
		}
		this._runAction(new Action(p))
		return p
	}

	// toString :: Promise e a -> String
	toString () {
		return '[object ' + this.inspect() + ']'
	}

	// inspect :: Promise e a -> String
	inspect () {
		const n = this.near()
		return n === this ? 'Promise { pending }' : n.inspect()
	}

	// near :: Promise e a -> Promise e a
	near () {
		if (!this._isResolved()) {
			return this
		}

		this.ref = this.ref.near()
		return this.ref
	}

	// state :: Promise e a -> Int
	state () {
		return this._isResolved() ? this.ref.near().state() : PENDING
	}

	_isResolved () {
		if (this.ref !== void 0) return true
		if (this.token != null && this.token.requested) {
			this.__become(this.token.getRejected())
			return true
		}
		return false
	}

	_when (action) {
		this._runAction(action)
	}

	_runAction (action) {
		if (this.action === void 0) {
			this.action = action
		} else {
			this[this.length++] = action
		}
	}

	_resolve (x) {
		this._become(resolve(x, this.token))
	}

	_fulfill (x) {
		this._become(new Fulfilled(x))
	}

	_reject (e) {
		if (this._isResolved()) {
			return
		}

		this.__become(new Rejected(e))
	}

	_become (p) {
		if (this._isResolved()) {
			return
		}

		this.__become(p)
	}

	__become (p) {
		this.ref = p === this ? cycle() : p
		this.token = null

		if (this.action === void 0) {
			return
		}

		taskQueue.add(this)
	}

	run () {
		/* eslint complexity:[2,6] */
		const p = this.ref.near()
		if (this.action.promise) p._runAction(this.action)
		else if (isRejected(p)) silenceError(p)
		this.action = void 0

		for (let i = 0; i < this.length; ++i) {
			if (this[i].promise) p._runAction(this[i])
			else if (isRejected(p)) silenceError(p)
			this[i] = void 0
		}
		this.length = 0
	}
}

// Fulfilled :: a -> Promise e a
// A promise whose value is already known
class Fulfilled extends Core {
	constructor (x) {
		super()
		this.value = x
	}

	then (f, _, token) {
		return typeof f === 'function' ? then(f, void 0, this, new Future(token)) : rejectedIfCancelled(token, this)
	}

	catch (_, token) {
		return rejectedIfCancelled(token, this)
	}

	map (f, token) {
		return map(f, this, new Future(token))
	}

	ap (p, token) {
		return p.map(this.value, token)
	}

	chain (f, token) {
		return chain(f, this, new Future(token))
	}

	concat (_) {
		return this
	}

	untilCancel (token) {
		return rejectedIfCancelled(token, this)
	}

	toString () {
		return '[object ' + this.inspect() + ']'
	}

	inspect () {
		return 'Promise { fulfilled: ' + this.value + ' }'
	}

	state () {
		return FULFILLED
	}

	near () {
		return this
	}

	_when (action) {
		taskQueue.add(new Continuation(action, this))
	}

	_runAction (action) {
		// assert: action.promise != null
		action.fulfilled(this)
	}
}

// Rejected :: Error e => e -> Promise e a
// A promise whose value cannot be known due to some reason/error
class Rejected extends Core {
	constructor (e) {
		super()
		this.value = e
		this._state = REJECTED // mutated by the silencer
		errorHandler.track(this)
	}

	then (_, r, token) {
		return typeof r === 'function' ? this.catch(r, token) : rejectedIfCancelled(token, this)
	}

	catch (r, token) {
		return then(void 0, r, this, new Future(token))
	}

	map (_, token) {
		return rejectedIfCancelled(token, this)
	}

	ap (_, token) {
		return rejectedIfCancelled(token, this)
	}

	chain (_, token) {
		return rejectedIfCancelled(token, this)
	}

	concat (_) {
		return this
	}

	untilCancel (token) {
		return rejectedIfCancelled(token, this)
	}

	toString () {
		return '[object ' + this.inspect() + ']'
	}

	inspect () {
		return 'Promise { rejected: ' + this.value + ' }'
	}

	state () {
		return this._state
	}

	near () {
		return this
	}

	_when (action) {
		taskQueue.add(new Continuation(action, this))
	}

	_runAction (action) {
		// assert: action.promise != null
		if (action.rejected(this)) {
			errorHandler.untrack(this)
		}
	}
}

// Never :: Promise e a
// A promise that waits forever for its value to be known
class Never extends Core {
	then (_, __, token) {
		return rejectedWhenCancel(token, this)
	}

	catch (_, token) {
		return rejectedWhenCancel(token, this)
	}

	map (_, token) {
		return rejectedWhenCancel(token, this)
	}

	ap (_, token) {
		return rejectedWhenCancel(token, this)
	}

	chain (_, token) {
		return rejectedWhenCancel(token, this)
	}

	concat (b) {
		return b
	}

	untilCancel (token) {
		return rejectedWhenCancel(token, this)
	}

	toString () {
		return '[object ' + this.inspect() + ']'
	}

	inspect () {
		return 'Promise { never }'
	}

	state () {
		return PENDING | NEVER
	}

	near () {
		return this
	}

	_when () {
	}

	_runAction () {
	}
}

const silencer = new Action(never())
silencer.fulfilled = function fulfilled (p) { }
silencer.rejected = function setHandled (p) {
	p._state |= HANDLED
}

export function silenceError (p) {
	p._runAction(silencer)
}

// -------------------------------------------------------------
// ## Creating promises
// -------------------------------------------------------------

// resolve :: Thenable e a -> CancelToken e -> Promise e a
// resolve :: Thenable e a -> Promise e a
// resolve :: a -> Promise e a
export function resolve (x, token) {
	/* eslint complexity:[2,6] */
	if (isPromise(x)) {
		return x.untilCancel(token)
	} else if (token != null && token.requested) {
		return token.getRejected()
	} else if (isObject(x)) {
		return refForMaybeThenable(x, token)
	} else {
		return new Fulfilled(x)
	}
}

export function resolveObject (o) {
	return isPromise(o) ? o.near() : refForMaybeThenable(o, null)
}

// reject :: e -> Promise e a
export function reject (e) {
	return new Rejected(e)
}

// never :: Promise e a
export function never () {
	return new Never()
}

// fulfill :: a -> Promise e a
export function fulfill (x) {
	return new Fulfilled(x)
}

// future :: () -> { resolve: Resolve e a, promise: Promise e a }
// type Resolve e a = a|Thenable e a -> ()
export function future (token) {
	const promise = new Future(token)
	return {resolve: x => promise._resolve(x), promise}
}

// -------------------------------------------------------------
// # Internals
// -------------------------------------------------------------

// isPromise :: * -> boolean
function isPromise (x) {
	return x instanceof Core
}

function rejectedIfCancelled (token, settled) {
	if (token == null) return settled
	token = CancelToken.from(token)
	if (token.requested) return token.getRejected()
	return settled
}
function rejectedWhenCancel (token, never) {
	if (token == null) return never
	return CancelToken.from(token).getRejected()
}

function refForMaybeThenable (x, token) {
	try {
		const then = x.then
		return typeof then === 'function'
			? extractThenable(then, x, token)
			: fulfill(x)
	} catch (e) {
		return new Rejected(e)
	}
}

// WARNING: Naming the first arg "then" triggers babel compilation bug
function extractThenable (thn, thenable, token) {
	const p = new Future()

	try {
		thn.call(thenable, x => p._resolve(x), e => p._reject(e), token)
	} catch (e) {
		p._reject(e)
	}

	return p.near()
}

function cycle () {
	return new Rejected(new TypeError('resolution cycle'))
}
