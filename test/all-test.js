import { describe, it } from 'mocha'
import { Future, all, resolve } from '../src/Promise'
import { throwingIterable, arrayIterable } from './lib/test-util'
import { is, eq, fail } from '@briancavalier/assert'

describe('all', () => {
	it('should reject if iterator throws', () => {
		const error = new Error()
		return all(throwingIterable(error))
			.then(fail, is(error))
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
		setTimeout(p => p._reject(2), 0, p)
		return all(arrayIterable([1, p, 3]))
			.catch(eq(2))
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
