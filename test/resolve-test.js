import { describe, it } from 'mocha'
import { resolve, fulfill, reject, future, isCancelled, CancelToken } from '../src/main'
import { Future, cancel } from '../src/Promise'
import { assertSame } from './lib/test-util'
import assert from 'assert'

describe('resolve', () => {
	it('should reject promise cycle', () => {
		const p = new Future()
		p._resolve(p)
		return p.then(assert.ifError, e => assert(e instanceof TypeError))
	})

	it('should reject indirect promise cycle', () => {
		const p1 = new Future()
		const p2 = new Future()
		p1._resolve(p2)
		p2._resolve(p1)
		return p1.then(assert.ifError, e => assert(e instanceof TypeError))
	})

	describe('thenables', () => {
		it('should resolve fulfilled thenable', () => {
			const expected = {}
			return resolve({ then: f => f(expected) })
				.then(x => assert.strictEqual(expected, x))
		})

		it('should resolve rejected thenable', () => {
			const expected = {}
			return resolve({ then: (f, r) => r(expected) })
				.then(assert.ifError, e => assert.strictEqual(expected, e))
		})

		it('should reject if thenable.then throws', () => {
			const expected = {}
			return resolve({ then: () => { throw expected } })
				.then(assert.ifError, e => assert.strictEqual(expected, e))
		})

		it('should reject if accessing thenable.then throws', () => {
			const expected = {}
			const thenable = {
				get then () { throw expected }
			}

			return resolve(thenable)
				.then(assert.ifError, e => assert.strictEqual(expected, e))
		})

		it('should receive a token', () => {
			const {token} = CancelToken.source()
			return resolve({
				then: (f, r, t) => {
					assert.strictEqual(t, token)
					f()
				}
			}, token)
		})

		it('should receive the token of the future it resolves', () => {
			const {token} = CancelToken.source()
			const p = new Future(token)
			p._resolve({
				then: (f, r, t) => {
					assert.strictEqual(t, token)
					f()
				}
			})
			return p
		})
	})

	describe('token', () => {
		it('should return cancellation with cancelled token for true', () => {
			const {token, cancel} = CancelToken.source()
			cancel({})
			assert.strictEqual(token.getCancelled(), resolve(true, token))
		})

		it('should return cancellation with cancelled token for future', () => {
			const {token, cancel} = CancelToken.source()
			cancel({})
			assert.strictEqual(token.getCancelled(), resolve(new Future(), token))
		})

		it('should return cancellation with cancelled token for fulfill', () => {
			const {token, cancel} = CancelToken.source()
			cancel({})
			assert.strictEqual(token.getCancelled(), resolve(fulfill(), token))
		})

		it('should return cancellation with cancelled token for reject', () => {
			const {token, cancel} = CancelToken.source()
			cancel({})
			assert.strictEqual(token.getCancelled(), resolve(reject(), token))
		})

		it('should be identity for future with same token', () => {
			const {token} = CancelToken.source()
			const p = new Future(token)
			assert.strictEqual(p, resolve(p, token))
		})

		it('should cancel result for unresolved promise', () => {
			const {token, cancel} = CancelToken.source()
			const {promise} = future()
			const p = resolve(promise, token)
			cancel({})
			assert(!isCancelled(promise))
			assert(isCancelled(p))
			return assertSame(token.getCancelled(), p)
		})

		it('should cancel result for unresolved promise with different token', () => {
			const {token, cancel} = CancelToken.source()
			const {promise} = future(CancelToken.empty())
			const p = resolve(promise, token)
			cancel({})
			assert(!isCancelled(promise))
			assert(isCancelled(p))
			return assertSame(token.getCancelled(), p)
		})
	})

	it('should be identity for fulfilled promise', () => {
		const p = fulfill()
		assert.strictEqual(resolve(p), p)
	})

	it('should be identity for rejected promise', () => {
		const p = reject()
		assert.strictEqual(resolve(p), p)
	})

	it('should be identity for unresolved promise', () => {
		const p = future().promise
		assert.strictEqual(resolve(p), p)
	})

	it('should reject for cancelled promise', () => {
		const expected = {}
		return resolve(cancel(expected)).trifurcate(assert.ifError, e => {
			assert.strictEqual(e, expected)
		}, assert.ifError)
	})
})
