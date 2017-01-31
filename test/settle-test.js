import { describe, it } from 'mocha'
import { settle, resolve, reject } from '../src/main'
import { isFulfilled, isRejected } from '../src/inspect'
import { throwingIterable, rejectsWith } from './lib/test-util'
import { is, eq, assert } from '@briancavalier/assert'

describe('settle', () => {
	it('should reject if iterator throws', () => {
		const expected = new Error()
		return rejectsWith(is(expected), settle(throwingIterable(expected)))
	})

	it('should settle empty iterable', () => {
		return settle(new Set()).then(a => eq(a.length, 0))
	})

	it('should settle promises', () => {
		const s = new Set([1, resolve(2), reject(3)])
		return settle(s).then(a => {
			eq(a.length, s.size)
			assert(isFulfilled(a[0]))
			assert(isFulfilled(a[1]))
			assert(isRejected(a[2]))
		})
	})
})
