'use strict'

import assert from 'assert'

export function assertSame (ap, bp) {
	return ap.then(a => bp.then(b => assert.strictEqual(a, b)),
	               a => bp.then(x => { throw x }, b => assert.strictEqual(a, b)))
}

export function throwingIterable (e) {
	return new FakeIterable(new ThrowingIterator(e))
}

export function arrayIterable (array) {
	return new FakeIterable(new ArrayIterator(array))
}

class FakeIterable {
	constructor (iterator) {
		this.iterator = iterator
	}

	[Symbol.iterator] () {
		return this.iterator
	}
}

class ArrayIterator {
	constructor (array) {
		this.array = array
		this.index = 0
	}

	next () {
		return this.index < this.array.length
						? { done: false, value: this.array[this.index++] }
						: { done: true, value: void 0 }
	}

	throw (e) {
		throw e
	}

	return () {}
}

class ThrowingIterator {
	constructor (error) {
		this.error = error
	}

	next () {
		throw this.error
	}

	throw (e) {
		throw e
	}
}

export class FakeCancelAction {
	constructor (promise, cb) {
		this.promise = promise
		this.cb = cb
		this.isCancelled = 0
		this.isDestroyed = 0
		const token = promise.token
		if (token != null) {
			token._subscribe(this)
		}
	}

	destroy () {
		this.isDestroyed++
		this.promise = null
	}

	cancel (p) {
		this.isCancelled++
		if (typeof this.cb === 'function') this.cb(p)
		if (typeof this.promise._isResolved !== 'function' || this.promise._isResolved()) {
			this.destroy()
		}
	}
}

export function raceCallbacks (future) {
	const {resolve, promise} = future()
	return {
		ok (x) {
			setTimeout(resolve, 1, x) // wait for noks
		},
		nok (e) {
			promise._reject(e)
		},
		result: promise
	}
}
