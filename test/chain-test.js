import { describe, it } from 'mocha'
import { fulfill, reject, delay } from '../src/main'
import { assertSame, assertTypeError, rejectsWith } from './lib/test-util'
import { is, rejects } from '@briancavalier/assert'

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
    const p = fulfill(1).chain(x => x)
    return rejectsWith(assertTypeError, p)
	})

	it('should not map rejection', () => {
		const expected = new Error()
    const p = delay(1, expected).then(reject)
    return rejectsWith(is(expected), p.chain(() => null))
	})
})
