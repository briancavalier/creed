import { describe, it } from 'mocha'
import { isNode } from '../src/env'
import assert from 'assert'

describe('env', () => {
	describe('isNode', () => {
		it('should be boolean', () => {
			assert(typeof isNode === 'boolean')
		})
	})
})
