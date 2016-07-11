import { describe, it } from 'mocha'
import { race, resolve, reject, never, isNever } from '../src/main'
import { throwingIterable } from './lib/test-util'
import assert from 'assert'

describe('race', () => {
	it('should reject if iterator throws', () => {
		let error = new Error()
		return race(throwingIterable(error))
			.then(assert.ifError, e => assert(e === error))
	})

	it('should return never when input is empty', () => {
		assert(isNever(race([])))
	})

	it('should reject with a TypeError when passed non-iterable', () => {
		return race(123).then(assert.ifError, e => assert(e instanceof TypeError))
	})

	it('should be identity for 1 element when value', () => {
		return race(new Set([1]))
			.then(x => assert.equal(x, 1))
	})

	it('should be identity for 1 element when fulfilled', () => {
		return race(new Set([resolve(1)]))
			.then(x => assert.equal(x, 1))
	})

	it('should be identity for 1 element when rejected', () => {
		return race(new Set([reject(1)]))
			.catch(x => assert.equal(x, 1))
	})

	it('should fulfill when winner fulfills', () => {
		return race([resolve(), never()])
	})

	it('should reject when winner rejects', () => {
		return race([reject(1), never()])
			.then(assert.ifError, x => assert.equal(x, 1))
	})
})
