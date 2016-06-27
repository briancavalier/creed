import { describe, it } from 'mocha'
import { fulfill, reject, getValue, CancelToken } from '../src/main'
import { silenceError } from '../src/Promise'
import { assertSame } from './lib/test-util'
import assert from 'assert'

describe('fulfill', () => {
	it('should wrap value', () => {
		const x = {}
		return fulfill(x).then(y => assert(x === y))
	})

	it('should be immediately fulfilled', () => {
		const x = {}
		assert.strictEqual(x, getValue(fulfill(x)))
	})

	it('should wrap promise', () => {
		const x = fulfill({})
		return fulfill(x).then(y => assert(x === y))
	})

	it('should wrap rejected promise', () => {
		const x = reject({})
		silenceError(x)
		return fulfill(x).then(y => assert(x === y))
	})

	it('then should be identity without f callback', () => {
		const p = fulfill(true)
		assert.strictEqual(p, p.then())
	})

	it('then with uncancelled token should be identity without f callback', () => {
		const p = fulfill(true)
		assert.strictEqual(p, p.then(null, null, CancelToken.empty()))
	})

	it('then with cancelled token should behave like cancellation', () => {
		const p = fulfill(true)
		const {token, cancel} = CancelToken.source()
		cancel({})
		return assertSame(token.getRejected(), p.then(assert.ifError, assert.ifError, token))
	})

	it('catch should be identity', () => {
		const p = fulfill(true)
		assert.strictEqual(p, p.catch(assert.ifError))
	})

	it('catch with uncancelled token should be identity', () => {
		const p = fulfill(true)
		assert.strictEqual(p, p.catch(assert.ifError, CancelToken.empty()))
	})

	it('catch with cancelled token should behave like cancellation', () => {
		const p = fulfill(true)
		const {token, cancel} = CancelToken.source()
		cancel({})
		return assertSame(token.getRejected(), p.catch(assert.ifError, token))
	})

	it('map with cancelled token should behave like cancellation', () => {
		const p = fulfill(true)
		const {token, cancel} = CancelToken.source()
		cancel({})
		return assertSame(token.getRejected(), p.map(assert.ifError, token))
	})

	it('ap with cancelled token should behave like cancellation', () => {
		const p = fulfill(assert.ifError)
		const {token, cancel} = CancelToken.source()
		cancel({})
		return assertSame(token.getRejected(), p.ap(fulfill(true), token))
	})

	it('chain with cancelled token should behave like cancellation', () => {
		const p = fulfill(true)
		const {token, cancel} = CancelToken.source()
		cancel({})
		return assertSame(token.getRejected(), p.chain(assert.ifError, token))
	})
})
