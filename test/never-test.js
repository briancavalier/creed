import { describe, it } from 'mocha'
import { never, fulfill, CancelToken } from '../src/main'
import assert from 'assert'

describe('never', () => {
	it('then should be identity', () => {
		const p = never()
		assert.strictEqual(p, p.then(assert.ifError, assert.ifError))
	})

	it('then with token should return the cancellation', () => {
		const p = never()
		const token = CancelToken.empty()
		assert.strictEqual(token.getRejected(), p.then(assert.ifError, assert.ifError, token))
	})

	it('catch should be identity', () => {
		const p = never()
		assert.strictEqual(p, p.catch(assert.ifError))
	})

	it('catch with token should return the cancellation', () => {
		const p = never()
		const token = CancelToken.empty()
		assert.strictEqual(token.getRejected(), p.catch(assert.ifError, token))
	})

	it('map should be identity', () => {
		const p = never()
		assert.strictEqual(p, p.map(assert.ifError))
	})

	it('map with token should return the cancellation', () => {
		const p = never()
		const token = CancelToken.empty()
		assert.strictEqual(token.getRejected(), p.map(assert.ifError, token))
	})

	it('ap should be identity', () => {
		const p = never()
		assert.strictEqual(p, p.ap(fulfill(true)))
	})

	it('ap with token should return the cancellation', () => {
		const p = never()
		const token = CancelToken.empty()
		assert.strictEqual(token.getRejected(), p.ap(fulfill(true), token))
	})

	it('chain should be identity', () => {
		const p = never()
		assert.strictEqual(p, p.chain(fulfill))
	})

	it('chain with token should return the cancellation', () => {
		const p = never()
		const token = CancelToken.empty()
		assert.strictEqual(token.getRejected(), p.chain(assert.ifError, token))
	})

	it('finally should be identity', () => {
		const p = never()
		assert.strictEqual(p, p.finally(() => {}))
	})

	it('trifurcate should be identity', () => {
		const p = never()
		assert.strictEqual(p, p.trifurcate(assert.ifError, assert.ifError, assert.ifError))
	})

	it('_when should not call action', () => {
		let fail = () => { throw new Error('never._when called action') }
		let action = {
			fulfilled: fail,
			rejected: fail
		}

		assert.strictEqual(void 0, never()._when(action))
	})
})
