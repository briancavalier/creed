import { describe, it } from 'mocha'
import { reject, fulfill, CancelToken } from '../src/main'
import { silenceError } from '../src/Promise'
import { assertSame } from './lib/test-util'
import assert from 'assert'

describe('reject', () => {
	it('then should be identity without r callback', () => {
		const p = reject(true)
		silenceError(p)
		assert.strictEqual(p, p.then(assert.ifError))
	})

	it('then with uncancelled token should be identity without r callback', () => {
		const p = reject(true)
		silenceError(p)
		assert.strictEqual(p, p.then(assert.ifError, null, CancelToken.empty()))
	})

	it('then with cancelled token should behave like cancellation', () => {
		const p = reject(true)
		const {token, cancel} = CancelToken.source()
		cancel({})
		return assertSame(token.getCancelled(), p.then(assert.ifError, null, token))
	})

	it('catch with cancelled token should behave like cancellation', () => {
		const p = reject(true)
		const {token, cancel} = CancelToken.source()
		cancel({})
		return assertSame(token.getCancelled(), p.catch(assert.ifError, token))
	})

	it('map should be identity', () => {
		const p = reject(true)
		silenceError(p)
		assert.strictEqual(p, p.map(assert.ifError))
	})

	it('map with uncancelled token should be identity', () => {
		const p = reject(true)
		silenceError(p)
		assert.strictEqual(p, p.map(assert.ifError, CancelToken.empty()))
	})

	it('map with cancelled token should behave like cancellation', () => {
		const p = reject(true)
		const {token, cancel} = CancelToken.source()
		cancel({})
		return assertSame(token.getCancelled(), p.map(assert.ifError, token))
	})

	it('ap should be identity', () => {
		const p = reject(assert.ifError)
		silenceError(p)
		assert.strictEqual(p, p.ap(fulfill(true)))
	})

	it('ap with uncancelled token should be identity', () => {
		const p = reject(assert.ifError)
		silenceError(p)
		assert.strictEqual(p, p.ap(fulfill(true), CancelToken.empty()))
	})

	it('ap with cancelled token should behave like cancellation', () => {
		const p = reject(assert.ifError)
		const {token, cancel} = CancelToken.source()
		cancel({})
		return assertSame(token.getCancelled(), p.ap(fulfill(true), token))
	})

	it('chain should be identity', () => {
		const p = reject()
		silenceError(p)
		assert.strictEqual(p, p.chain(fulfill))
	})

	it('chain with uncancelled token should be identity', () => {
		const p = reject()
		silenceError(p)
		assert.strictEqual(p, p.chain(fulfill, CancelToken.empty()))
	})

	it('chain with cancelled token should behave like cancellation', () => {
		const p = reject(true)
		const {token, cancel} = CancelToken.source()
		cancel({})
		return assertSame(token.getCancelled(), p.chain(assert.ifError, token))
	})

	it('trifurcate should be identity without r callback', () => {
		const p = reject(true)
		silenceError(p)
		assert.strictEqual(p, p.trifurcate(assert.ifError, undefined, assert.ifError))
	})
})
