import TaskQueue from './TaskQueue'
import ErrorHandler from './ErrorHandler'
import makeEmitError from './emitError'
import maybeThenable from './maybeThenable'
import { PENDING, FULFILLED, REJECTED, NEVER } from './state'
import { isNever, isSettled } from './inspect'

import then from './then'
import map from './map'
import chain from './chain'

import Race from './Race'
import Merge from './Merge'
import { resolveIterable, resultsArray } from './iterable'

const taskQueue = new TaskQueue()
export { taskQueue }

/* istanbul ignore next */
const errorHandler = new ErrorHandler(makeEmitError(), e => {
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
		this.ref = void 0
		this.action = void 0
		this.length = 0
	}

	// then :: Promise e a -> (a -> b) -> Promise e b
	// then :: Promise e a -> () -> (e -> b) -> Promise e b
	// then :: Promise e a -> (a -> b) -> (e -> b) -> Promise e b
	then (f, r) {
		const n = this.near()
		return n === this ? then(f, r, n, new Future()) : n.then(f, r)
	}

	// catch :: Promise e a -> (e -> b) -> Promise e b
	['catch'] (r) {
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

	_resolve (x) {
		this._become(resolve(x))
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

		if (this.action === void 0) {
			return
		}

		taskQueue.add(this)
	}

	run () {
		const p = this.ref.near()
		p._runAction(this.action)
		this.action = void 0

		for (let i = 0; i < this.length; ++i) {
			p._runAction(this[i])
			this[i] = void 0
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

	['catch'] () {
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
		this._state = REJECTED
		errorHandler.track(this)
	}

	then (_, r) {
		return typeof r === 'function' ? this.catch(r) : this
	}

	['catch'] (r) {
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

	['catch'] () {
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

// -------------------------------------------------------------
// ## Creating promises
// -------------------------------------------------------------

// resolve :: Thenable e a -> Promise e a
// resolve :: a -> Promise e a
export function resolve (x) {
	return isPromise(x) ? x.near()
		: maybeThenable(x) ? refForMaybeThenable(fulfill, x)
		: new Fulfilled(x)
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
// ## Iterables
// -------------------------------------------------------------

// all :: Iterable (Promise e a) -> Promise e [a]
export function all (promises) {
	const handler = new Merge(allHandler, resultsArray(promises))
	return iterablePromise(handler, promises)
}

const allHandler = {
	merge (promise, args) {
		promise._fulfill(args)
	}
}

// race :: Iterable (Promise e a) -> Promise e a
export function race (promises) {
	return iterablePromise(new Race(never), promises)
}

function isIterable (x) {
	return typeof x === 'object' && x !== null
}

export function iterablePromise (handler, iterable) {
	if (!isIterable(iterable)) {
		return reject(new TypeError('expected an iterable'))
	}

	const p = new Future()
	return resolveIterable(resolveMaybeThenable, handler, iterable, p)
}

// -------------------------------------------------------------
// # Internals
// -------------------------------------------------------------

// isPromise :: * -> boolean
function isPromise (x) {
	return x instanceof Core
}

function resolveMaybeThenable (x) {
	return isPromise(x) ? x.near() : refForMaybeThenable(fulfill, x)
}

function refForMaybeThenable (otherwise, x) {
	try {
		const then = x.then
		return typeof then === 'function'
			? extractThenable(then, x)
			: otherwise(x)
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

class Continuation {
	constructor (action, promise) {
		this.action = action
		this.promise = promise
	}

	run () {
		this.promise._runAction(this.action)
	}
}
