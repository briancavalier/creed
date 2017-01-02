import { describe, it } from 'mocha'
import { fulfill, delay, reject } from '../src/main'
import { assertSame } from './lib/test-util'
import assert from 'assert'

describe('map', () => {
	it('should satisfy identity', () => {
		const u = fulfill({})
		return assertSame(u.map(x => x), u)
	})

	it('should satisfy composition', () => {
		const f = x => x + 'f'
		const g = x => x + 'g'
		const u = fulfill('e')

		return assertSame(u.map(x => f(g(x))), u.map(g).map(f))
	})

	it('should reject if f throws', () => {
		const expected = {}
		return delay(1).map(() => { throw expected })
			.then(assert.ifError, x => assert.strictEqual(x, expected))
	})

	it('should not map rejection', () => {
		const expected = {}
		return delay(1, expected).then(reject).map(() => null)
			.then(assert.ifError, x => assert.strictEqual(x, expected))
	})
})
