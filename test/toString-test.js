import { describe, it } from 'mocha'
import { fulfill, reject, never, getValue, getReason } from '../src/main'
import { Future } from '../src/Promise'
import assert from 'assert'

describe('toString', () => {
	it('should indicate fulfilled promise', () => {
		let p = fulfill('a')
		assert.equal(`[object Promise { fulfilled: ${getValue(p)} }]`,
						p.toString())
	})

	it('should indicate rejected promise', () => {
		let p = reject(new Error('a'))
		assert.equal(`[object Promise { rejected: ${getReason(p)} }]`,
						p.toString())
	})

	it('should indicate pending promise', () => {
		let p = new Future()
		assert.equal('[object Promise { pending }]', p.toString())
	})

	it('should indicate never', () => {
		let p = never()
		assert.equal('[object Promise { never }]', p.toString())
	})
})
