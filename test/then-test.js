import { describe, it } from 'mocha'
import { delay, reject } from '../src/main'
import assert from 'assert'

describe('then', function () {
	it('should not change value when f is not a function', () => {
		let expected = {}
		return delay(1, expected).then()
			.then(x => assert.strictEqual(x, expected))
	})

	it('should not change reason when r is not a function', () => {
		let expected = {}
		return delay(1, expected).then(reject).then(x => null)
			.then(assert.ifError, x => assert.strictEqual(x, expected))
	})

	it('should reject if f throws', () => {
		let expected = {}
		return delay(1).then(() => { throw expected })
			.then(assert.ifError, x => assert.strictEqual(x, expected))
	})

	it('should reject if r throws', () => {
		let expected = {}
		return delay(1).then(reject).then(null, () => { throw expected })
			.then(assert.ifError, x => assert.strictEqual(x, expected))
	})
})
