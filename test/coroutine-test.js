import { describe, it } from 'mocha'
import { coroutine, fulfill, reject, delay, isRejected, CancelToken } from '../src/main'
import { assertSame } from './lib/test-util'
import assert from 'assert'

describe('coroutine', function () {
	it('should allow parameters', () => {
		const f = coroutine(function *(a, b) {
			assert.equal(a, 'a')
			assert.equal(b, 'b')
		})

		return f('a', 'b')
	})

	it('should continue on fulfilled promises', () => {
		const f = coroutine(function *(a, b) {
			return (yield delay(1, a)) + (yield fulfill(b))
		})

		return f('a', 'b').then(x => assert.equal(x, 'ab'))
	})

	it('should throw on rejected promises', () => {
		const expected = new Error()
		const f = coroutine(function *(a) {
			try {
				yield reject(a)
			} catch (e) {
				return e
			}
		})

		return f(expected)
			.then(x => assert.strictEqual(x, expected))
	})

	it('should reject on uncaught exception', () => {
		const expected = new Error()
		const f = coroutine(function *(a) {
			yield reject(a)
		})

		return f(expected)
			.then(assert.ifError, e => assert.strictEqual(e, expected))
	})

	describe('cancellation', () => {
		it('should receive a token cancelled outside', () => {
			let executed = false
			const f = coroutine(function* (token) {
				coroutine.cancel = token
				yield delay(5)
				executed = true
				return 1
			})
			const {token, cancel} = CancelToken.source()
			const expected = {}
			delay(3, expected).then(cancel)
			return f(token).then(assert.ifError, x => {
				assert.strictEqual(x, expected)
				return delay(5).then(() => assert(!executed))
			})
		})

		it('should execute finally but not catch statements', () => {
			let executedT = false
			let executedC = false
			let executedF = false
			const f = coroutine(function* (token) {
				coroutine.cancel = token
				try {
					yield delay(5)
					executedT = true
				} catch (e) {
					executedC = true
				} finally {
					executedF = true
				}
				return 1
			})
			const {token, cancel} = CancelToken.source()
			f(token)
			return delay(3, {}).then(cancel).then(() => {
				assert(!executedT, 'after yield')
				assert(!executedC, 'catch block')
				assert(executedF, 'finally block')
			})
		})

		it('should wait on yields in finally statements', () => {
			let executed = false
			const f = coroutine(function* (token) {
				coroutine.cancel = token
				try {
					yield delay(5)
				} finally {
					yield delay(2)
					executed = true
				}
				return 1
			})
			const {token, cancel} = CancelToken.source()
			const p = f(token)
			const d = delay(3, {}).then(() => {
				cancel()
				assert(isRejected(p))
				assert(!executed, 'at yield')
			})
			return delay(5, d).then(() => assert(executed, 'after yield in finally block'))
		})

		it('should receive a token cancelled inside', () => {
			const expected = {}
			let rejected = false
			let executedT = false
			let executedF = false
			const f = coroutine(function* () {
				const {token, cancel} = CancelToken.source()
				coroutine.cancel = token
				yield delay(1)
				try {
					cancel(expected)
					rejected = isRejected(p)
					yield
					executedT = true
				} finally {
					executedF = true
				}
			})
			const p = f()
			return p.then(assert.ifError, x => {
				assert(rejected, 'immediately rejected')
				assert.strictEqual(x, expected)
				assert(!executedT, 'after yield')
				assert(executedF, 'finally block')
			})
		})

		it('should cancel when receiving a cancelled token', () => {
			const {token, cancel} = CancelToken.source()
			cancel({})
			const f = coroutine(function* () {
				coroutine.cancel = token
			})
			return assertSame(f(), token.getRejected())
		})

		it('should not cancel when the last received token is not cancelled', () => {
			return coroutine(function* () {
				const {token, cancel} = CancelToken.source()
				coroutine.cancel = token
				yield
				coroutine.cancel = null
				cancel({})
				return 1
			})().then(x => assert.strictEqual(x, 1))
		})

		it('should work for recursive coroutines', () => {
			let counter = 0
			const f = coroutine(function* (token) {
				coroutine.cancel = token
				yield delay(1)
				try {
					counter++
					yield f(token)
				} finally {
					counter--
				}
			})
			const {token, cancel} = CancelToken.source()
			const p = f(token)
			return delay(15).then(() => {
				cancel({})
				assert(isRejected(p))
				assert.strictEqual(counter, 0)
			})
		})
	})

	describe('coroutine.cancel', () => {
		it('should always return the same token', () => {
			return coroutine(function* () {
				const token = coroutine.cancel
				assert.strictEqual(coroutine.cancel, token)
				coroutine.cancel = CancelToken.empty()
				assert.strictEqual(coroutine.cancel, token)
				coroutine.cancel = null
				assert.strictEqual(coroutine.cancel, token)
				coroutine.cancel = coroutine.cancel
				assert.strictEqual(coroutine.cancel, token)
			})()
		})

		it('should return the token of the result promise', () => {
			const p = coroutine(function* () {
				yield delay(1)
				assert.strictEqual(coroutine.cancel, p.token)
			})()
			return p
		})

		it('should not be available outside a coroutine', () => {
			assert.throws(() => coroutine.cancel, SyntaxError)
			assert.throws(() => { coroutine.cancel = null }, SyntaxError)
		})

		it('should not be available in finally blocks after cancellation', () => {
			let err
			const p = coroutine(function* () {
				const {token, cancel} = CancelToken.source()
				coroutine.cancel = token
				try {
					yield delay(1)
					yield cancel()
				} finally {
					try {
						assert(isRejected(p))
						assert.throws(() => coroutine.cancel, SyntaxError)
						assert.throws(() => { coroutine.cancel = null }, SyntaxError)
					} catch (e) {
						err = e
					}
				}
			})()
			return p.then(assert.ifError, () => assert.ifError(err))
		})

		it('should throw when assigned to after cancellation', () => {
			let err
			const p = coroutine(function* () {
				const {token, cancel} = CancelToken.source()
				coroutine.cancel = token
				yield delay(1)
				cancel()
				try {
					assert(isRejected(p))
					assert.throws(() => { coroutine.cancel = null }, ReferenceError)
					assert.throws(() => { coroutine.cancel = CancelToken.empty() }, ReferenceError)
				} catch (e) {
					err = e
				}
			})()
			return p.then(assert.ifError, () => assert.ifError(err))
		})
	})
})
