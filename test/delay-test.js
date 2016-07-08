import { describe, it } from 'mocha'
import { delay, never, reject, fulfill, isCancelled, isNever, isPending, CancelToken } from '../src/main'
import { Future, silenceError } from '../src/Promise'
import { assertSame } from './lib/test-util'
import assert from 'assert'

const lte = (a, b) => (a - 1) <= b

describe('delay', function () {
	it('should be identity for 0 ms', () => {
		const p = fulfill()
		assert.strictEqual(p, delay(0, p))
	})

	it('should be identity for rejected', () => {
		const p = reject()
		silenceError(p)
		assert.strictEqual(p, delay(1, p))
	})

	it('should not delay rejected', () => {
		const p = new Future()
		const d = delay(1, p)

		assert(isPending(d))

		const x = {}
		p._reject(x)

		return d.then(assert.ifError, e => assert.strictEqual(x, e))
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

	it('should delay fulfilled when never cancelled', () => {
		const x = {}
		const t = 10
		const p = delay(t, fulfill(x), CancelToken.empty())

		const now = Date.now()
		return assertSame(fulfill(x), p)
			.then(() => assert(lte(t, Date.now() - now)))
	})

	it('should return cancellation with cancelled token for fulfill', () => {
		const {token, cancel} = CancelToken.source()
		cancel({})
		const p = delay(10, fulfill(1), token)
		assert.strictEqual(token.getCancelled(), p)
	})

	it('should return cancellation with cancelled token for reject', () => {
		const {token, cancel} = CancelToken.source()
		cancel({})
		const p = delay(10, reject(1), token)
		assert.strictEqual(token.getCancelled(), p)
	})

	it('should behave like cancellation when cancelled for never', () => {
		const {token, cancel} = CancelToken.source()
		const p = delay(10, never(), token)
		cancel({})
		assert(isCancelled(p))
		return assertSame(token.getCancelled(), p)
	})

	it('should behave like cancellation when cancelled', () => {
		const {token, cancel} = CancelToken.source()
		const p = delay(10, fulfill(1), token)
		cancel({})
		assert(isCancelled(p))
		return assertSame(token.getCancelled(), p)
	})

	it('should behave like cancellation when cancelled during delay', () => {
		const {token, cancel} = CancelToken.source()
		const p = delay(10, fulfill(1), token)
		return delay(5).then(() => {
			cancel({})
			assert(isCancelled(p))
			return assertSame(token.getCancelled(), p)
		})
	})

	it('should behave like cancellation when cancelled before fulfill', () => {
		const {token, cancel} = CancelToken.source()
		const p = delay(5, delay(10), token)
		return delay(5).then(() => {
			cancel({})
			assert(isCancelled(p))
			return assertSame(token.getCancelled(), p)
		})
	})
})
