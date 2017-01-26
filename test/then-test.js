import { describe, it } from 'mocha'
import { delay, reject } from '../src/main'
import { is, fail } from '@briancavalier/assert'

describe('then', function () {
	it('should not change value when f is not a function', () => {
		let expected = {}
		return delay(1, expected).then()
			.then(is(expected))
	})

	it('should not change reason when r is not a function', () => {
		let expected = {}
		return delay(1, expected).then(reject).then(x => null)
			.then(fail, is(expected))
	})

	it('should reject if f throws', () => {
		let expected = {}
		return delay(1).then(() => { throw expected })
			.then(fail, is(expected))
	})

	it('should reject if r throws', () => {
		let expected = {}
		return delay(1).then(reject).then(null, () => { throw expected })
			.then(fail, is(expected))
	})
})
