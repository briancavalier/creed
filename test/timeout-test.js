import { describe, it } from 'mocha'
import { timeout, delay } from '../src/main'
import TimeoutError from '../src/TimeoutError'
import { Future, reject, fulfill } from '../src/Promise'
import { silenceError } from '../src/inspect'
import assert from 'assert'

function delayReject (ms, e) {
	let p = new Future()
	setTimeout(e => p._reject(e), ms, e)
	return p
}

describe('timeout', function () {
	it('should be identity for fulfilled', () => {
		let p = fulfill()
		assert.strictEqual(p, timeout(0, p))
	})

	it('should be identity for rejected', () => {
		let p = reject()
		silenceError(p)
		assert.strictEqual(p, timeout(0, p))
	})

	it('should reject if timeout is earlier than fulfill', () => {
		return timeout(1, delay(10, true))
						.then(assert.ifError, assert)
	})

	it('should fulfill if timeout is later than fulfill', () => {
		let x = {}
		return timeout(10, delay(1, x))
						.then(a => assert.strictEqual(x, a))
	})

	it('should reject if timeout is earlier than reject', () => {
		return timeout(1, delayReject(10, {}))
						.then(assert.ifError, e => assert(e instanceof TimeoutError))
	})

	it('should reject if timeout is later than reject', () => {
		let x = {}
		return timeout(10, delayReject(1, x))
						.then(assert.ifError, e => assert.strictEqual(x, e))
	})
})
