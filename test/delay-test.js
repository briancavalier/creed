import { describe, it } from 'mocha'
import { delay } from '../src/main'
import { Future, never, reject, fulfill } from '../src/Promise'
import { silenceError, isNever, isPending } from '../src/inspect'
import { assertSame } from './lib/test-util'
import { is, assert, fail } from '@briancavalier/assert'

const lte = (a, b) => (a - 1) <= b

describe('delay', function () {
	it('should be identity for 0 ms', () => {
		const p = fulfill()
		is(p, delay(0, p))
	})

	it('should be identity for rejected', () => {
		const p = reject()
		silenceError(p)
		is(p, delay(1, p))
	})

	it('should not delay rejected', () => {
		const p = new Future()
		const d = delay(1, p)

		assert(isPending(d))

		const e = new Error()
		p._reject(e)

		return d.then(fail, is(e))
	})

	it('should return never for never', () => {
		assert(isNever(delay(0, never())))
	})

	it('should delay value', () => {
		const x = {}
		const t = 10
		const p = delay(t, x)

		const now = Date.now()
		return assertSame(fulfill(x), p)
			.then(() => assert(lte(t, Date.now() - now)))
	})

	it('should delay fulfilled', () => {
		const x = {}
		const t = 10
		const p = delay(t, fulfill(x))

		const now = Date.now()
		return assertSame(fulfill(x), p)
			.then(() => assert(lte(t, Date.now() - now)))
	})
})
