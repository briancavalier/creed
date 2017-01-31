import { describe, it } from 'mocha'
import { Promise, fulfill, reject } from '../src/main'
import { is, assert, fail } from '@briancavalier/assert'
import { rejectsWith } from './lib/test-util'

describe('Promise', () => {
	it('should call resolver synchronously', () => {
		let called = false
		const p = new Promise((resolve) => {
			called = true
			resolve()
		})
		assert(called)
		return p
	})

	it('should reject if resolver throws synchronously', () => {
		const expected = new Error()
		const p = new Promise(() => { throw expected })
		return rejectsWith(is(expected), p)
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
			const p = new Promise(resolve => resolve(reject(expected)))
			return rejectsWith(is(expected), p)
		})

		it('should reject with value', () => {
			const expected = new Error()
			const p = new Promise((resolve, reject) => reject(expected))
			return rejectsWith(is(expected), p)
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
			const p = new Promise(resolve => setTimeout(resolve, 1, reject(expected)))
			return rejectsWith(is(expected), p)
		})

		it('should asynchronously reject with value', () => {
			const expected = new Error()
			const p = new Promise((resolve, reject) => setTimeout(reject, 1, expected))
			return rejectsWith(is(expected), p)
		})
	})
})
