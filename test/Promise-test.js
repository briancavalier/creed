import { describe, it } from 'mocha'
import { Promise, fulfill, reject } from '../src/main'
import { is, assert, fail } from '@briancavalier/assert'

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
			.then(fail, is(expected))
	})

	describe('resolvers', () => {
		it('should fulfill with value', () => {
			const expected = {}
			return new Promise(resolve => resolve(expected))
				.then(is(expected))
		})

		it('should resolve to fulfilled promise', () => {
			const expected = {}
			return new Promise(resolve => resolve(fulfill(expected)))
				.then(is(expected))
		})

		it('should resolve to rejected promise', () => {
			const expected = new Error()
			return new Promise(resolve => resolve(reject(expected)))
				.then(fail, is(expected))
		})

		it('should reject with value', () => {
			const expected = new Error()
			return new Promise((resolve, reject) => reject(expected))
				.then(fail, is(expected))
		})

		it('should asynchronously fulfill with value', () => {
			const expected = {}
			return new Promise(resolve => setTimeout(resolve, 1, expected))
				.then(is(expected))
		})

		it('should asynchronously resolve to fulfilled promise', () => {
			const expected = {}
			return new Promise(resolve => setTimeout(resolve, 1, fulfill(expected)))
				.then(is(expected))
		})

		it('should asynchronously resolve to rejected promise', () => {
			const expected = new Error()
			return new Promise(resolve => setTimeout(resolve, 1, reject(expected)))
				.then(fail, is(expected))
		})

		it('should asynchronously reject with value', () => {
			const expected = new Error()
			return new Promise((resolve, reject) => setTimeout(reject, 1, expected))
				.then(fail, is(expected))
		})
	})
})
