import { describe, it } from 'mocha'
import { fulfill, delay, reject, never } from '../src/main'
import { silenceError } from '../src/inspect'
import { assertSame } from './lib/test-util'
import assert from 'assert'

describe('concat', function () {
	it('should be identity for fulfill', () => {
		const p = fulfill()
		assert.strictEqual(p, p.concat(fulfill()))
	})

	it('should be identity for reject', () => {
		const p = reject()
		silenceError(p)
		assert.strictEqual(p, p.concat(fulfill()))
	})

	it('should return other for never', () => {
		const p1 = never()
		const p2 = fulfill()
		assert.strictEqual(p2, p1.concat(p2))
	})

	it('should return earlier future', () => {
		const expected = {}
		const p = delay(10).concat(delay(1, expected))
		return assertSame(p, fulfill(expected))
	})

	it('should behave like fulfilled', () => {
		const expected = {}
		const p = fulfill(expected)
		return assert.strictEqual(delay(10).concat(p), p)
	})

	it('should behave like rejected', () => {
		const expected = {}
		const p = reject(expected)
		silenceError(p)
		return assert.strictEqual(delay(10).concat(p), p)
	})

	it('should behave like never', () => {
		const p2 = never()
		const p1 = delay(10)
		return assert.strictEqual(p1.concat(p2), p1)
	})
})
