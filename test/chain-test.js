import { describe, it } from 'mocha'
import { fulfill, reject, delay } from '../src/main'
import { assertSame } from './lib/test-util'
import assert from 'assert'

describe('chain', function () {
	it('should satisfy associativity', () => {
		const f = x => fulfill(x + 'f')
		const g = x => fulfill(x + 'g')

		const m = fulfill('m')

		return assertSame(
			m.chain(x => f(x).chain(g)),
			m.chain(f).chain(g)
		)
	})

	it('should reject if f returns a non-promise', () => {
		return fulfill(1).chain(x => x)
			.then(
				() => { throw new Error('should not fulfill') },
				e => assert(e instanceof TypeError)
			)
	})

	it('should not map rejection', () => {
		const expected = {}
		return delay(1, expected).then(reject).chain(() => null)
			.then(assert.ifError, x => assert.strictEqual(x, expected))
	})

	it('should have cycle detection', () => {
		const p = delay(1).chain(() => p)
		return p.then(assert.ifError, e => assert(e instanceof TypeError))
	})
})
