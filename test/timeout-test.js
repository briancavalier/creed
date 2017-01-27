import { describe, it } from 'mocha'
import { timeout, delay } from '../src/main'
import TimeoutError from '../src/TimeoutError'
import { Future, reject, fulfill } from '../src/Promise'
import { silenceError } from '../src/inspect'
import { is, assert, fail } from '@briancavalier/assert'

function delayReject (ms, e) {
	const p = new Future()
	setTimeout(e => p._reject(e), ms, e)
	return p
}

const isTimeoutError = e => assert(e instanceof TimeoutError)

describe('timeout', function () {
	it('should be identity for fulfilled', () => {
		const p = fulfill()
		is(p, timeout(0, p))
	})

	it('should be identity for rejected', () => {
		const p = reject()
		silenceError(p)
		is(p, timeout(0, p))
	})

	it('should reject if timeout is earlier than fulfill', () => {
		return timeout(1, delay(10, true)).then(fail, isTimeoutError)
	})

	it('should fulfill if timeout is later than fulfill', () => {
		const x = {}
		return timeout(10, delay(1, x)).then(is(x))
	})

	it('should reject if timeout is earlier than reject', () => {
		return timeout(1, delayReject(10, new Error())).then(fail, isTimeoutError)
	})

	it('should reject if timeout is later than reject', () => {
		let x = new Error()
		return timeout(10, delayReject(1, x)).then(fail, is(x))
	})
})
