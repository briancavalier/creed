import { describe, it } from 'mocha'
import { all, resolve } from '../src/main'
import { Future } from '../src/Promise'
import { throwingIterable, arrayIterable } from './lib/test-util'
import assert from 'assert'

describe('all', () => {
	it('should reject if iterator throws', () => {
		const error = new Error()
		return all(throwingIterable(error))
			.then(assert.ifError, e => assert(e === error))
	})

	it('should resolve empty iterable', () => {
		return all([]).then(a => assert.equal(a.length, 0))
	})

	it('should resolve values', () => {
		const expected = [1, 2, 3]
		return all(arrayIterable(expected))
			.then(a => assert.deepEqual(a, expected))
	})

	it('should resolve promises', () => {
		const p = new Future()
		setTimeout(p => p._resolve(3), 0, p)
		return all(arrayIterable([resolve(1), 2, p]))
			.then(a => assert.deepEqual(a, [1, 2, 3]))
	})

	it('should reject if input contains rejection', () => {
		const p = new Future()
		setTimeout(p => p._reject(2), 0, p)
		return all(arrayIterable([1, p, 3]))
			.catch(x => assert.equal(x, 2))
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
				assert.strictEqual(expected, a[0])
				assert.equal(1, a.length)
			})
		})
	})
})
