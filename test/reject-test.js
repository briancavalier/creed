import { describe, it } from 'mocha'
import { fulfill, reject } from '../src/main'
import { silenceError } from '../src/inspect'
import assert from 'assert'

describe('reject', () => {
	it('then should be identity without r callback', () => {
		const p = reject(true)
		silenceError(p)
		assert.strictEqual(p, p.then(assert.ifError))
	})

	it('map should be identity', () => {
		const p = reject(true)
		silenceError(p)
		assert.strictEqual(p, p.map(assert.ifError))
	})

	it('ap should be identity', () => {
		const p = reject(assert.ifError)
		silenceError(p)
		assert.strictEqual(p, p.ap(fulfill()))
	})

	it('chain should be identity', () => {
		const p = reject()
		silenceError(p)
		assert.strictEqual(p, p.chain(fulfill))
	})
})
