import { describe, it } from 'mocha'
import { future, fulfill, reject, delay, CancelToken } from '../src/main'
import { assertSame } from './lib/test-util'
import assert from 'assert'

describe('finally', () => {
	it('should throw when f is not a function', () => {
		const p = fulfill()
		assert.throws(() => p.finally(), TypeError)
		assert.throws(() => p.finally(''), TypeError)
		assert.throws(() => p.finally(1), TypeError)
		assert.throws(() => p.finally(false), TypeError)
	})

	it('should call f for fulfill', () => {
		let called = false
		return fulfill().finally(() => {
			called = true
		}).then(() => {
			assert(called)
		})
	})

	it('should call f for reject', () => {
		let called = false
		return reject().finally(() => {
			called = true
		}).then(assert.ifError, () => {
			assert(called)
		})
	})

	it('should call f for future fulfill', () => {
		let called = false
		const {promise, resolve} = future()
		const p = promise.finally(() => {
			called = true
		}).then(assert.ifError, () => {
			assert(called)
		})
		resolve(fulfill())
		return p
	})

	it('should call f for future reject', () => {
		let called = false
		const {promise, resolve} = future()
		const p = promise.finally(() => {
			called = true
		}).then(assert.ifError, () => {
			assert(called)
		})
		resolve(reject())
		return p
	})

	it('should call f with uncancelled token for future fulfill', () => {
		let called = false
		const {promise, resolve} = future(CancelToken.empty())
		const p = promise.finally(() => {
			called = true
		}).then(() => {
			assert(called)
		})
		resolve(fulfill())
		return p
	})

	it('should call f with uncancelled token for already fulfilled future', () => {
		let called = false
		const {promise, resolve} = future(CancelToken.empty())
		resolve(fulfill())
		return promise.finally(() => {
			called = true
		}).then(() => {
			assert(called)
		})
	})

	it('should call f for already cancelled future', () => {
		let called = false
		const {token, cancel} = CancelToken.source()
		cancel()
		const {promise} = future(token)
		return promise.finally(() => {
			called = true
		}).trifurcate(assert.ifError, assert.ifError, () => {
			assert(called)
		})
	})

	describe('cancel', () => {
		it('should call f asynchronously', () => {
			let called = false
			const {token, cancel} = CancelToken.source()
			const p = delay(1, null, token).finally(() => {
				called = true
			})
			cancel()
			assert(!called)
			return p.trifurcate(assert.ifError, assert.ifError, () => {
				assert(called)
			})
		})

		it('should return fulfilled callback result', () => {
			const expected = fulfill({})
			const reason = new Error('cancelled')
			const {token, cancel} = CancelToken.source()
			const p = delay(1, null, token).finally(() => {
				return expected
			}).trifurcate(assert.ifError, assert.ifError, e => {
				assert.strictEqual(e, reason)
				return assertSame(c[0], expected)
			})
			const c = cancel(reason)
			return p
		})

		it('should return callback exception', () => {
			const expected = {}
			const {token, cancel} = CancelToken.source()
			const p = delay(1, null, token).finally(() => {
				throw expected
			}).trifurcate(assert.ifError, assert.ifError, () => {
				return assertSame(c[0], reject(expected))
			})
			const c = cancel()
			return p
		})

		it('should cancel result during f call for fulfilled future', () => {
			const reason = {}
			const {token, cancel} = CancelToken.source()
			let c
			return delay(1, null, token).finally(() => {
				c = cancel(reason)
			}).trifurcate(assert.ifError, assert.ifError, e => {
				assert.strictEqual(e, reason)
				assert.strictEqual(c.length, 1)
			})
		})
	})

	describe('return value', () => {
		it('should behave like input for fulfill', () => {
			const p = fulfill({})
			return assertSame(p.finally(() => {}), p)
		})

		it('should behave like input for reject', () => {
			const p = reject({})
			return assertSame(p.finally(() => {}), p)
		})

		it('should not resolve before the callback result', () => {
			let called = false
			const expected = {}
			return fulfill(expected).finally(() => {
				return delay(3).then(() => { called = true })
			}).then(x => {
				assert.strictEqual(x, expected)
				assert(called)
			})
		})

		it('should behave like rejection for throwing callback', () => {
			const expected = {}
			return fulfill().finally(() => {
				throw expected
			}).then(assert.ifError, e => {
				assert.strictEqual(e, expected)
			})
		})

		it('should behave like rejection for rejecting callback', () => {
			const p = reject({})
			return assertSame(p, fulfill().finally(() => {
				return p
			}))
		})
	})
})
