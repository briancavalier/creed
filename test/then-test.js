import { describe, it } from 'mocha'
import { delay, reject } from '../src/main'
import { is, fail } from '@briancavalier/assert'
import { rejectsWith } from './lib/test-util'

describe('then', function () {
	it('should not change value when f is not a function', () => {
		const expected = {}
		return delay(1, expected).then()
			.then(is(expected))
	})

	it('should not change reason when r is not a function', () => {
		const expected = {}
		const p = delay(1, expected).then(reject).then(x => null)
		return rejectsWith(is(expected), p)
	})

	it('should reject if f throws', () => {
		const expected = {}
		const p = delay(1).then(() => { throw expected })
		return rejectsWith(is(expected), p)
	})

	it('should reject if r throws', () => {
		const expected = {}
		const p = delay(1).then(reject).then(null, () => { throw expected })
		return rejectsWith(is(expected), p)
	})
})
