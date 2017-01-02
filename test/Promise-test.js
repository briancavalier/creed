import { describe, it } from 'mocha'
import { Promise, fulfill, reject } from '../src/main'
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
	})
})
