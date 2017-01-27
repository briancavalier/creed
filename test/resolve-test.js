import { describe, it } from 'mocha'
import { resolve, Future } from '../src/Promise'
import { is, assert, fail } from '@briancavalier/assert'

const isTypeError = e => assert(e instanceof TypeError)

describe('resolve', () => {
	it('should reject promise cycle', () => {
		let p = new Future()
		p._resolve(p)
		return p.then(fail, isTypeError)
	})

	describe('thenables', () => {
		it('should resolve fulfilled thenable', () => {
			const expected = {}
			return resolve({ then: f => f(expected) }).then(is(expected))
		})

		it('should resolve rejected thenable', () => {
			const expected = new Error()
			return resolve({ then: (f, r) => r(expected) })
				.then(fail, is(expected))
		})

		it('should reject if thenable.then throws', () => {
			const expected = new Error()
			return resolve({ then: () => { throw expected } })
				.then(fail, is(expected))
		})

		it('should reject if accessing thenable.then throws', () => {
			const expected = new Error()
			const thenable = {
				get then () { throw expected }
			}

			return resolve(thenable).then(fail, is(expected))
		})
	})
})
