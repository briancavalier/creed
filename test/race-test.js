import { describe, it } from 'mocha'
import { race, resolve, reject, never } from '../src/main'
import { isNever } from '../src/inspect'
import { throwingIterable } from './lib/test-util'
import { is, eq, assert, fail} from '@briancavalier/assert'

const isTypeError = e => assert(e instanceof TypeError)

describe('race', () => {
	it('should reject if iterator throws', () => {
		let error = new Error()
		return race(throwingIterable(error)).then(fail, is(error))
	})

	it('should return never when input is empty', () => {
		assert(isNever(race([])))
	})

	it('should reject with a TypeError when passed non-iterable', () => {
		return race(123).then(fail, isTypeError)
	})

	it('should be identity for 1 element when value', () => {
		return race(new Set([1])).then(eq(1))
	})

	it('should be identity for 1 element when fulfilled', () => {
		return race(new Set([resolve(1)])).then(eq(1))
	})

	it('should be identity for 1 element when rejected', () => {
		const expected = new Error()
		return race(new Set([reject(expected)]))
			.then(fail, is(expected))
	})

	it('should fulfill when winner fulfills', () => {
		return race([resolve(), never()])
	})

	it('should reject when winner rejects', () => {
		const expected = new Error()
		return race([reject(expected), never()])
			.then(fail, is(expected))
	})
})
