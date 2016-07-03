import { describe, it } from 'mocha'
import { any, resolve, reject } from '../src/main'
import { throwingIterable, arrayIterable } from './lib/test-util'
import assert from 'assert'

describe('any', () => {
	it('should reject if iterator throws', () => {
		const error = new Error()
		return any(throwingIterable(error))
			.then(assert.ifError, e => assert(e === error))
	})

	it('should reject with RangeError for empty iterable', () => {
		return any(new Set()).catch(e => assert(e instanceof RangeError))
	})

	it('should resolve a value', () => {
		const a = [1, 2, 3]
		const s = arrayIterable(a)
		return any(s).then(x => assert(a.indexOf(x) >= 0))
	})

	it('should resolve a promise', () => {
		const a = [1, 2, 3]
		const s = arrayIterable(a.map(resolve))
		return any(s).then(x => assert(a.indexOf(x) >= 0))
	})

	it('should resolve if at least one input resolves', () => {
		const s = arrayIterable([reject(1), reject(2), resolve(3)])
		return any(s).then(x => assert.equal(x, 3))
	})

	it('should reject if all inputs reject', () => {
		const s = arrayIterable([1, 2, 3].map(reject))
		return any(s).catch(() => assert(true))
	})
})
