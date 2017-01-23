import { describe, it } from 'mocha'
import { fulfill, reject } from '../src/main'
import { silenceError } from '../src/inspect'
import { is, fail } from '@briancavalier/assert'

describe('reject', () => {
	it('then should be identity without r callback', () => {
		const p = reject(true)
		silenceError(p)
		is(p, p.then(fail))
	})

	it('map should be identity', () => {
		const p = reject(true)
		silenceError(p)
		is(p, p.map(fail))
	})

	it('ap should be identity', () => {
		const p = reject(fail)
		silenceError(p)
		is(p, p.ap(fulfill(true)))
	})

	it('chain should be identity', () => {
		const p = reject()
		silenceError(p)
		is(p, p.chain(fulfill))
	})
})
