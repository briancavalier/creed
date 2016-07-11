import { isObject, noop } from './util'
import { PENDING, FULFILLED, REJECTED, CANCELLED, NEVER, HANDLED } from './state'
import { isRejected, isNever, isSettled } from './inspect'

import { TaskQueue, Continuation } from './TaskQueue'
import ErrorHandler from './ErrorHandler'
import emitError from './emitError'

import Action from './Action'
import then from './then'
import map from './map'
import chain from './chain'
import fin from './finally'
import trifurcate from './trifurcate'

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

	// toString :: Promise e a -> String
	toString () {
		return '[object ' + this.inspect() + ']'
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
		this.token = CancelToken.from(token)
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
			return p.token.getCancelled()
		}
		this._runAction(new Action(p))
		return p
	}

	// finally :: Promise e a -> (Promise e a -> ()) -> Promise e a
	finally (f) {
		const n = this.near()
		return n === this ? fin(f, this, new Future()) : n.finally(f)
	}

	// trifurcate :: Promise e a -> (a -> b) -> (e -> b) -> (e -> b) -> Promise e b
	trifurcate (f, r, c) {
		const n = this.near()
		return n === this ? trifurcate(f, r, c, this, new Future()) : n.trifurcate(f, r, c)
	}

	// inspect :: Promise e a -> String
	inspect () {
		const n = this.near()
		return n === this ? 'Promise { pending }' : n.inspect()
	}

	// near :: Promise e a -> Promise e a
	near () {
		if (!this._isResolved() || this.ref === this) {
			return this
		} else {
			this.ref = this.ref.near()
			return this.ref
		}
	}

	// state :: Promise e a -> Int
	state () {
		return this._isResolved() && this.ref !== this ? this.ref.near().state() : PENDING
	}

	_isResolved () {
		if (this.token != null && this.token.requested) {
			this.__become(this.token.getCancelled())
		}
		return this.ref !== void 0
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

	_resolve (x, cancelAction) {
		if (this._isResolved()) {
			return // TODO: still resolve thenables when cancelled?
		}
		if (isPromise(x)) {
			this._resolvePromise(x.near(), cancelAction)
		} else {
			// TODO: can a thenable end up with a Never?
			if (cancelAction) {
				cancelAction.end()
			}
			this.__become(isObject(x) ? refForMaybeThenable(x, this.token) : new Fulfilled(x))
		}
	}

	_resolvePromise (p, cancelAction) {
		/* eslint complexity:[2,6] */
		if (p === this) {
			p = cycle()
		} else {
			const state = p.state()
			if ((state & NEVER) > 0) {
				p = p.untilCancel(this.token)
			} else if ((state & CANCELLED) > 0) {
				p = reject(p.value)
			} else if ((state & PENDING) > 0 && this.token !== p.token) {
				this.ref = this
				// reuse cancelAction - do not .end() it here
				p._runAction(cancelAction || new Action(this))
				return
			}
		}
		if (cancelAction) {
			cancelAction.end()
		}
		this.__become(p)
	}

	_fulfill (x) {
		this._become(new Fulfilled(x))
	}

	_reject (e) {
		if (this._isResolved()) {
			return
		}

		this.__become(reject(e))
	}

	_become (p) {
		if (this._isResolved()) {
			return
		}

		this.__become(p)
	}

	__become (p) {
		// assert: isSettled(p) || isNever(p) || p.token === this.token
		// assert: this.ref == null || this.ref === this
		this.ref = p
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
		return typeof f === 'function' ? then(f, void 0, this, new Future(token)) : cancelledIfRequested(token, this)
	}

	catch (_, token) {
		return cancelledIfRequested(token, this)
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
		return cancelledIfRequested(token, this)
	}

	finally (f) {
		return fin(f, this, new Future())
	}

	trifurcate (f, r, c) {
		return typeof f === 'function' ? then(f, undefined, this, new Future()) : this
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
	}

	then (_, r, token) {
		return typeof r === 'function' ? this.catch(r, token) : this._cancelledIfRequested(token)
	}

	catch (r, token) {
		return then(void 0, r, this, new Future(token))
	}

	map (_, token) {
		return this._cancelledIfRequested(token)
	}

	ap (_, token) {
		return this._cancelledIfRequested(token)
	}

	chain (_, token) {
		return this._cancelledIfRequested(token)
	}

	concat (_) {
		return this._cancelledIfRequested(null)
	}

	untilCancel (token) {
		return this._cancelledIfRequested(token)
	}

	finally (f) {
		return fin(f, this, new Future())
	}

	trifurcate (f, r, c) {
		return typeof r === 'function' ? then(undefined, r, this, new Future()) : this
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

	_cancelledIfRequested (token) {
		return cancelledIfRequested(token, this)
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

// Cancelled :: Error e => e -> Promise e a
// A promise whose value was invalidated and cannot be known
class Cancelled extends Rejected {
	trifurcate (f, r, c) {
		return trifurcate(undefined, undefined, c, this, new Future())
	}

	inspect () {
		return 'Promise { cancelled: ' + this.value + ' }'
	}

	state () {
		return REJECTED | CANCELLED | HANDLED
	}

	_cancelledIfRequested (token) {
		// like cancelledIfRequested(token, this), but not quite
		token = CancelToken.from(token)
		return token != null && token.requested ? token.getCancelled() : reject(this.value)
	}

	_runAction (action) {
		// assert: action.promise != null
		action.cancelled(this)
	}
}

// Never :: Promise e a
// A promise that waits forever for its value to be known
class Never extends Core {
	then (_, __, token) {
		return cancelledWhen(token, this)
	}

	catch (_, token) {
		return cancelledWhen(token, this)
	}

	map (_, token) {
		return cancelledWhen(token, this)
	}

	ap (_, token) {
		return cancelledWhen(token, this)
	}

	chain (_, token) {
		return cancelledWhen(token, this)
	}

	concat (b) {
		return b
	}

	untilCancel (token) {
		return cancelledWhen(token, this)
	}

	finally (_) {
		return this
	}

	trifurcate (f, r, c) {
		return this
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
silencer.fulfilled = noop
silencer.cancelled = noop
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
	/* eslint complexity:[2,7] */
	if (isPromise(x)) {
		return x.untilCancel(token)
	} else if (token != null && token.requested) {
		return token.getCancelled()
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
	const r = new Rejected(e)
	errorHandler.track(r)
	return r
}

// cancel :: e -> Promise e a
export function cancel (e) {
	return new Cancelled(e)
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
	if (promise.token == null) {
		return {
			promise,
			resolve (x) { promise._resolve(x) }
		}
	}
	let put = new Action(promise)
	return {
		promise,
		resolve (x) {
			if (put == null) return
			promise._resolve(x, put)
			put = null
		}
	}
}

// makeResolvers :: Promise e a -> { resolve: Resolve e a, reject: e -> () }
export function makeResolvers (promise) {
	if (promise.token != null) {
		let put = new Action(promise)
		return {
			resolve (x) {
				if (put == null || put.promise == null) return
				promise._resolve(x, put)
				put = promise = null
			},
			reject (e) {
				if (put == null || put.promise == null) return
				promise._reject(e)
				put.end()
				put = promise = null
			}
		}
	} else {
		return {
			resolve (x) {
				promise._resolve(x)
			},
			reject (e) {
				promise._reject(e)
			}
		}
	}
}

// -------------------------------------------------------------
// # Internals
// -------------------------------------------------------------

// isPromise :: * -> boolean
function isPromise (x) {
	return x instanceof Core
}

function cancelledIfRequested (token, settled) {
	token = CancelToken.from(token)
	return token != null && token.requested ? token.getCancelled() : settled
}

function cancelledWhen (token, never) {
	if (token == null) return never
	return CancelToken.from(token).getCancelled()
}

function refForMaybeThenable (x, token) {
	try {
		const then = x.then
		return typeof then === 'function'
			? extractThenable(then, x, new Future(token))
			: fulfill(x)
	} catch (e) {
		return reject(e)
	}
}

// WARNING: Naming the first arg "then" triggers babel compilation bug
function extractThenable (thn, thenable, p) {
	const { resolve, reject } = makeResolvers(p)
	try {
		thn.call(thenable, resolve, reject, p.token)
	} catch (e) {
		p._reject(e)
	}

	return p.near()
}

function cycle () {
	return reject(new TypeError('resolution cycle'))
}
