import { describe, it } from 'mocha'
import { Promise, reject } from '../src/main'
import { silenceError, getValue } from '../src/inspect'
import assert from 'assert'

describe('of', () => {
	it('should wrap value', () => {
		const x = {}
		return Promise.of(x).then(y => assert.strictEqual(x, y))
	})

	it('should be immediately fulfilled', () => {
		const x = {}
		assert.strictEqual(x, getValue(Promise.of(x)))
	})

	it('should wrap promise', () => {
		const x = Promise.of({})
		return Promise.of(x).then(y => assert.strictEqual(x, y))
	})

	it('should wrap rejected promise', () => {
		const x = reject({})
		silenceError(x)
		return Promise.of(x).then(y => assert.strictEqual(x, y))
	})
})
