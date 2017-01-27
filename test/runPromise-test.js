import { describe, it } from 'mocha'
import { runPromise, resolve } from '../src/main'
import { is, assert, fail, throws } from '@briancavalier/assert'

const isTypeError = e => assert(e instanceof TypeError)
const throwsTypeError = f => isTypeError(throws(f))

describe('runPromise', () => {
	it('should throw synchronously when function not provided', () => {
		throwsTypeError(runPromise)
	})

	it('should reject if resolver throws', () => {
		const expected = new Error()
		return runPromise(x => { throw x }, expected)
			.then(fail, is(expected))
	})

	it('should reject', () => {
		let expected = new Error()
		return runPromise((_, reject) => reject(expected))
			.then(fail, is(expected))
	})

	it('should resolve', () => {
		let expected = {}
		return runPromise(resolve => resolve(expected))
			.then(is(expected))
	})

	describe('when rejected explicitly', () => {
		it('should ignore subsequent throw', () => {
			const expected = new Error()
			return runPromise((_, reject) => {
				reject(expected)
				throw new Error()
			}).then(fail, is(expected))
		})

		it('should ignore subsequent reject', () => {
			const expected = new Error()
			return runPromise((_, reject) => {
				reject(expected)
				reject(new Error())
			}).then(fail, is(expected))
		})

		it('should ignore subsequent resolve', () => {
			let expected = {}
			return runPromise((_, reject) => {
				reject(expected)
				resolve()
			}).then(fail, is(expected))
		})
	})

	describe('when resolved explicitly', () => {
		it('should ignore subsequent throw', () => {
			const expected = {}
			return runPromise(resolve => {
				resolve(expected)
				throw new Error()
			}).then(is(expected))
		})

		it('should ignore subsequent reject', () => {
			const expected = {}
			return runPromise((resolve, reject) => {
				resolve(expected)
				reject(new Error())
			}).then(is(expected))
		})

		it('should ignore subsequent resolve', () => {
			const expected = {}
			return runPromise(resolve => {
				resolve(expected)
				resolve()
			}).then(is(expected))
		})
	})

	describe('should pass arguments to resolver', () => {
		it('for 1 argument', () => {
			const a = {}
			return runPromise((w, resolve) => {
				is(a, w)
				resolve()
			}, a)
		})

		it('for 2 arguments', () => {
			const a = {}
			const b = {}
			return runPromise((w, x, resolve) => {
				is(a, w)
				is(b, x)
				resolve()
			}, a, b)
		})

		it('for 3 arguments', () => {
			const a = {}
      const b = {}
      const c = {}
			return runPromise((w, x, y, resolve) => {
				is(a, w)
				is(b, x)
				is(c, y)
				resolve()
			}, a, b, c)
		})

		it('for 4 or more arguments', () => {
      const a = {}
      const b = {}
      const c = {}
      const d = {}
			return runPromise((w, x, y, z, resolve) => {
        is(a, w)
        is(b, x)
        is(c, y)
				is(d, z)
				resolve()
			}, a, b, c, d)
		})
	})
})
