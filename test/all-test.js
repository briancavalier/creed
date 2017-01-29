import { describe, it } from 'mocha'
import { Future, all, resolve } from '../src/Promise'
import { throwingIterable, arrayIterable } from './lib/test-util'
import { is, eq, rejects } from '@briancavalier/assert'

const rejectsWith = (expected, p) =>
	rejects(p).then(is(expected))

describe('all', () => {
	it('should reject if iterator throws', () => {
		const expected = new Error()
		return rejectsWith(expected, all(throwingIterable(expected)))
	})

	it('should resolve empty iterable', () => {
		return all([]).then(eq([]))
	})

	it('should resolve values', () => {
		const expected = [1, 2, 3]
		return all(arrayIterable(expected))
			.then(eq(expected))
	})

	it('should resolve promises', () => {
		const p = new Future()
		setTimeout(p => p._resolve(3), 0, p)
		return all(arrayIterable([resolve(1), 2, p]))
			.then(eq([1, 2, 3]))
	})

	it('should reject if input contains rejection', () => {
		const p = new Future()
		const expected = new Error()
		setTimeout(p => p._reject(expected), 0, p)
		return rejectsWith(expected, all(arrayIterable([1, p, 3])))
	})

	describe('when input contains thenables', () => {
		it('should resolve thenables', () => {
			const expected = {}
			const thenable = {
				then (f) {
					f(expected)
				}
			}

			return all(arrayIterable([thenable])).then(a => {
				is(expected, a[0])
				eq(1, a.length)
			})
		})
	})
})
