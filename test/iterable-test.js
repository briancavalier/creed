import { describe, it } from 'mocha'
import { Future, resolve } from '../src/Promise'
import { resolveIterable } from '../src/iterable'
import { arrayIterable } from './lib/test-util'
import assert from 'assert'

describe('iterable', () => {
	it('should reject if itemHandler throws synchronously before resolution', () => {
		const error = new Error()
		const itemHandler = {
			valueAt () {
				throw error
			}
		}

		const iterable = arrayIterable([1, 2, 3])
		return resolveIterable(resolve, itemHandler, iterable, new Future())
			.then(assert.ifError, e => assert.strictEqual(error, e))
	})

	it('should not reject if itemHandler throws synchronously after resolution', () => {
		const error = new Error()
		const itemHandler = {
			valueAt () {
				throw error
			}
		}

		const iterable = arrayIterable([1, 2, 3])
		const expected = {}
		const promise = new Future()
		promise._resolve(expected)

		return resolveIterable(resolve, itemHandler, iterable, promise)
			.then(x => assert.strictEqual(expected, x))
	})
})
