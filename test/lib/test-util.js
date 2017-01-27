'use strict'

import { is, fail } from '@briancavalier/assert'

export const assertSame = (ap, bp) =>
	ap.then(a => bp.then(is(a)),
		a => bp.then(x => { throw x }, is(a)))

export const assertSameRejected = (ap, bp) =>
	ap.then(fail, a => bp.then(fail, is(a)))

export const throwingIterable = e =>
	new FakeIterable(new ThrowingIterator(e))

export const arrayIterable = array =>
	new FakeIterable(new ArrayIterator(array))

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
