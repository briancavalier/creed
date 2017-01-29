import { describe, it } from 'mocha'
import { any, resolve, reject } from '../src/main'
import { throwingIterable, arrayIterable } from './lib/test-util'
import { eq, is, assert, rejects, fail } from '@briancavalier/assert'

const rejectsWithRangeError = p =>
	rejects(p).then(e => e instanceof RangeError)

describe('any', () => {
	it('should reject if iterator throws', () => {
		const error = new Error()
		return any(throwingIterable(error))
			.then(fail, is(error))
	})

	it('should reject with RangeError for empty iterable', () => {
		return rejectsWithRangeError(any(new Set()))
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
		return any(s).then(eq(3))
	})

	it('should reject if all inputs reject', () => {
		const s = arrayIterable([1, 2, 3].map(reject))
		return rejectsWithRangeError(any(s))
	})
})
