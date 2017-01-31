import { describe, it } from 'mocha'
import { resolve, Future } from '../src/Promise'
import { assertTypeError, rejectsWith } from './lib/test-util'
import { is } from '@briancavalier/assert'

describe('resolve', () => {
	it('should reject promise cycle', () => {
		const p = new Future()
		p._resolve(p)
		return rejectsWith(assertTypeError, p)
	})

	describe('thenables', () => {
		it('should resolve fulfilled thenable', () => {
			const expected = {}
			return resolve({ then: f => f(expected) }).then(is(expected))
		})

		it('should resolve rejected thenable', () => {
			const expected = new Error()
			return rejectsWith(is(expected), resolve({ then: (f, r) => r(expected) }))
		})

		it('should reject if thenable.then throws', () => {
			const expected = new Error()
			return rejectsWith(is(expected), resolve({ then: () => { throw expected } }))
		})

		it('should reject if accessing thenable.then throws', () => {
			const expected = new Error()
			const thenable = {
				get then () { throw expected }
			}

			return rejectsWith(is(expected), resolve(thenable))
		})
	})
})
