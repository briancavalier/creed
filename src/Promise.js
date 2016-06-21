import { isObject } from './util'
import { PENDING, FULFILLED, REJECTED, NEVER, HANDLED } from './state'
import { isNever, isSettled } from './inspect'

import { TaskQueue, Continuation } from './TaskQueue'
import ErrorHandler from './ErrorHandler'
import emitError from './emitError'

import Handle from './Handle'

import Action from './Action'
import then from './then'
import map from './map'
import chain from './chain'

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
	constructor () {
		super()
		this.handle = void 0
	}

	// then :: Promise e a -> (a -> b) -> Promise e b
	// then :: Promise e a -> () -> (e -> b) -> Promise e b
	// then :: Promise e a -> (a -> b) -> (e -> b) -> Promise e b
	then (f, r) {
		const n = this.near()
		return n === this ? then(f, r, n, new Future()) : n.then(f, r)
	}

	// catch :: Promise e a -> (e -> b) -> Promise e b
	catch (r) {
		const n = this.near()
		return n === this ? then(void 0, r, n, new Future()) : n.catch(r)
	}

	// map :: Promise e a -> (a -> b) -> Promise e b
	map (f) {
		const n = this.near()
		return n === this ? map(f, n, new Future()) : n.map(f)
	}

	// ap :: Promise e (a -> b) -> Promise e a -> Promise e b
	ap (p) {
		const n = this.near()
		const pp = p.near()
		return n === this ? this.chain(f => pp.map(f)) : n.ap(pp)
	}

	// chain :: Promise e a -> (a -> Promise e b) -> Promise e b
	chain (f) {
		const n = this.near()
		return n === this ? chain(f, n, new Future()) : n.chain(f)
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
		if (this.handle === void 0) {
			return this
		}
		return this.handle.near()
	}

	// state :: Promise e a -> Int
	state () {
		// return this._isResolved() ? this.handle.near().state() : PENDING
		var n = this.near()
		return n === this ? PENDING : n.state()
	}

	_isResolved () {
		return this.near() !== this
	}

	_when (action) {
		this._runAction(action)
	}

	_runAction (action) {
		if (this.handle) {
			this.handle._add(action)
		} else if (action.ref != null && action.ref !== this) {
			this.handle = new Handle(this)
			this.handle._add(action)
		} else {
			this.handle = action
			this.handle.ref = this
		}
	}

	_resolve (x) {
		x = resolve(x)
		if (this._isResolved()) {
			return
		}
		this._become(x)
	}

	_fulfill (x) {
		if (this._isResolved()) {
			return
		}
		this._become(new Fulfilled(x))
	}

	_reject (e) {
		if (this._isResolved()) {
			return
		}
		this._become(new Rejected(e))
	}

	_become (p) {
		if (p === this) {
			p = cycle()
		}

		if (this.handle) {
			// assert: this.handle.ref === this
			this.handle.ref = p
			if (isSettled(p)) {
				taskQueue.add(this.handle)
			} else {
				p._runAction(this.handle)
			}
		} else {
			if (isSettled(p)) {
				// for not unnecessarily creating handles that never see any actions
				// works well because it has a near() method
				this.handle = p
			} else {
				this.handle = new Handle(p)
			}
		}
	}
}

// Fulfilled :: a -> Promise e a
// A promise whose value is already known
class Fulfilled extends Core {
	constructor (x) {
		super()
		this.value = x
	}

	then (f) {
		return typeof f === 'function' ? then(f, void 0, this, new Future()) : this
	}

	catch () {
		return this
	}

	map (f) {
		return map(f, this, new Future())
	}

	ap (p) {
		return p.map(this.value)
	}

	chain (f) {
		return chain(f, this, new Future())
	}

	concat () {
		return this
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

	then (_, r) {
		return typeof r === 'function' ? this.catch(r) : this
	}

	catch (r) {
		return then(void 0, r, this, new Future())
	}

	map () {
		return this
	}

	ap () {
		return this
	}

	chain () {
		return this
	}

	concat () {
		return this
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
		if (action.rejected(this)) {
			errorHandler.untrack(this)
		}
	}
}

// Never :: Promise e a
// A promise that waits forever for its value to be known
class Never extends Core {
	then () {
		return this
	}

	catch () {
		return this
	}

	map () {
		return this
	}

	ap () {
		return this
	}

	chain () {
		return this
	}

	concat (b) {
		return b
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

// resolve :: Thenable e a -> Promise e a
// resolve :: a -> Promise e a
export function resolve (x) {
	return isPromise(x) ? x.near()
		: isObject(x) ? refForMaybeThenable(x)
		: new Fulfilled(x)
}

export function resolveObject (o) {
	return isPromise(o) ? o.near() : refForMaybeThenable(o)
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
export function future () {
	const promise = new Future()
	return {resolve: x => promise._resolve(x), promise}
}

// -------------------------------------------------------------
// # Internals
// -------------------------------------------------------------

// isPromise :: * -> boolean
function isPromise (x) {
	return x instanceof Core
}

function refForMaybeThenable (x) {
	try {
		const then = x.then
		return typeof then === 'function'
			? extractThenable(then, x)
			: fulfill(x)
	} catch (e) {
		return new Rejected(e)
	}
}

// WARNING: Naming the first arg "then" triggers babel compilation bug
function extractThenable (thn, thenable) {
	const p = new Future()

	try {
		thn.call(thenable, x => p._resolve(x), e => p._reject(e))
	} catch (e) {
		p._reject(e)
	}

	return p.near()
}

function cycle () {
	return new Rejected(new TypeError('resolution cycle'))
}
