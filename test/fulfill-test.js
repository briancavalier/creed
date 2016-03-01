import { describe, it } from 'mocha'
import { fulfill, reject } from '../src/main'
import { silenceError, getValue } from '../src/inspect'
import assert from 'assert'

describe('fulfill', () => {
	it('should wrap value', () => {
		const x = {}
		return fulfill(x).then(y => assert(x === y))
	})

	it('should be immediately fulfilled', () => {
		const x = {}
		assert.strictEqual(x, getValue(fulfill(x)))
	})

	it('should wrap promise', () => {
		const x = fulfill({})
		return fulfill(x).then(y => assert(x === y))
	})

	it('should wrap rejected promise', () => {
		const x = reject({})
		silenceError(x)
		return fulfill(x).then(y => assert(x === y))
	})

	it('catch should be identity', () => {
		const p = fulfill(true)
		assert.strictEqual(p, p.catch(assert.ifError))
	})

	it('then should be identity when typeof f !== function', () => {
		const p = fulfill(true)
		assert.strictEqual(p, p.then())
	})
})
