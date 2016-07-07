import { describe, it } from 'mocha'
import { Promise, fulfill, reject, isRejected, CancelToken } from '../src/main'
import { assertSame } from './lib/test-util'
import assert from 'assert'

describe('Promise', () => {
	it('should call resolver synchronously', () => {
		let called = false
		const p = new Promise((resolve, reject) => {
			called = true
			resolve()
		})
		assert(called)
		return p
	})

	it('should not call executor and immediately reject when token is requested', () => {
		const {token, cancel} = CancelToken.source()
		cancel({})
		let called = false
		const p = new Promise((resolve, reject) => {
			called = true
		}, token)
		assert(isRejected(p))
		assert(!called)
		return assertSame(token.getRejected(), p)
	})

	it('should reject if resolver throws synchronously', () => {
		const expected = new Error()
		return new Promise(() => { throw expected })
			.then(assert.ifError, x => assert.strictEqual(expected, x))
	})

	describe('resolvers', () => {
		it('should fulfill with value', () => {
			const expected = {}
			return new Promise(resolve => resolve(expected))
				.then(x => assert.strictEqual(expected, x))
		})

		it('should resolve to fulfilled promise', () => {
			const expected = {}
			return new Promise(resolve => resolve(fulfill(expected)))
				.then(x => assert.strictEqual(expected, x))
		})

		it('should resolve to rejected promise', () => {
			const expected = new Error()
			return new Promise(resolve => resolve(reject(expected)))
				.then(assert.ifError, x => assert.strictEqual(expected, x))
		})

		it('should reject with value', () => {
			const expected = new Error()
			return new Promise((resolve, reject) => reject(expected))
				.then(assert.ifError, x => assert.strictEqual(expected, x))
		})

		it('should asynchronously fulfill with value', () => {
			const expected = {}
			return new Promise(resolve => setTimeout(resolve, 1, expected))
				.then(x => assert.strictEqual(expected, x))
		})

		it('should asynchronously resolve to fulfilled promise', () => {
			const expected = {}
			return new Promise(resolve => setTimeout(resolve, 1, fulfill(expected)))
				.then(x => assert.strictEqual(expected, x))
		})

		it('should asynchronously resolve to rejected promise', () => {
			const expected = new Error()
			return new Promise(resolve => setTimeout(resolve, 1, reject(expected)))
				.then(assert.ifError, x => assert.strictEqual(expected, x))
		})

		it('should asynchronously reject with value', () => {
			const expected = new Error()
			return new Promise((resolve, reject) => setTimeout(reject, 1, reject(expected)))
				.then(assert.ifError, x => assert.strictEqual(expected, x))
		})

		it('should not change state when called multiple times', () => {
			let res, rej
			const promise = new Promise((resolve, reject) => {
				res = resolve
				rej = reject
			})
			res(1)
			const expected = promise.state()
			res(2)
			assert.strictEqual(promise.state(), expected)
			rej(3)
			assert.strictEqual(promise.state(), expected)
		})

		it('should not change state with token when called multiple times', () => {
			let res, rej
			const promise = new Promise((resolve, reject) => {
				res = resolve
				rej = reject
			}, CancelToken.empty())
			res(1)
			const expected = promise.state()
			res(2)
			assert.strictEqual(promise.state(), expected)
			rej(3)
			assert.strictEqual(promise.state(), expected)
		})
	})

	describe('token', () => {
		it('should immediately reject the promise when cancelled', () => {
			const {token, cancel} = CancelToken.source()
			const expected = new Error()
			const p = new Promise(resolve => {}, token)
			cancel(expected)
			assert(isRejected(p))
			return p.then(assert.ifError, x => assert.strictEqual(expected, x))
		})

		it('should prevent otherwise fulfilling the promise after cancellation', () => {
			const {token, cancel} = CancelToken.source()
			const expected = new Error()
			return new Promise(resolve => {
				setTimeout(() => {
					cancel(expected)
					resolve(1)
				}, 1)
			}, token).then(assert.ifError, x => assert.strictEqual(expected, x))
		})

		it('should prevent otherwise rejecting the promise after cancellation', () => {
			const {token, cancel} = CancelToken.source()
			const expected = new Error()
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					cancel(expected)
					reject(1)
				}, 1)
			}, token).then(assert.ifError, x => assert.strictEqual(expected, x))
		})

		it('should have no effect after fulfilling the promise', () => {
			const {token, cancel} = CancelToken.source()
			const expected = {}
			return new Promise(resolve => {
				setTimeout(() => {
					resolve(expected)
					cancel(new Error())
				}, 1)
			}, token).then(x => assert.strictEqual(expected, x))
		})

		it('should have no effect after rejecting the promise', () => {
			const {token, cancel} = CancelToken.source()
			const expected = new Error()
			return new Promise((_, reject) => {
				setTimeout(() => {
					reject(expected)
					cancel(1)
				}, 1)
			}, token).then(assert.ifError, x => assert.strictEqual(expected, x))
		})

		it('should still reject the promise after resolving the promise without settling it', () => {
			const {token, cancel} = CancelToken.source()
			const expected = {}
			return new Promise(resolve => {
				setTimeout(() => {
					resolve(new Promise(resolve => setTimeout(resolve, 1)))
					cancel(expected)
				}, 1)
			}, token).then(assert.ifError, x => assert.strictEqual(expected, x))
		})
	})
})
