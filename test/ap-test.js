import { describe, it } from 'mocha'
import { delay } from '../src/main'
import { assertSame } from './lib/test-util'

const fulfill = x => delay(1, x)

describe('ap', () => {
	it('should satisfy identity', () => {
		const a = fulfill({})
		return assertSame(a.ap(fulfill(x => x)), a)
	})

	it('should satisfy composition', () => {
		const u = fulfill(x => 'u' + x)
		const v = fulfill(x => 'v' + x)
		const a = fulfill('a')

		return assertSame(
			a.ap(u.ap(v.map(f => g => x => f(g(x))))),
			a.ap(u).ap(v)
		)
	})

	it('should satisfy homomorphism', () => {
		const f = x => x + 'f'
		const a = 'a'
		return assertSame(fulfill(a).ap(fulfill(f)), fulfill(f(a)))
	})

	it('should satisfy interchange', () => {
		const a = 'w'
		const pf = fulfill(x => 'f' + x)
		return assertSame(fulfill(a).ap(pf), pf.ap(fulfill(f => f(a))))
	})
})
