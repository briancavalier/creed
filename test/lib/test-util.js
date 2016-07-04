'use strict'

import assert from 'assert'

export function assertSame (ap, bp) {
	return ap.then(a => bp.then(b => assert(a === b)))
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

	['throw'] (e) {
		throw e
	}

	['return'] () {}
}

class ThrowingIterator {
	constructor (error) {
		this.error = error
	}

	next () {
		throw this.error
	}

	['throw'] (e) {
		throw e
	}
}
