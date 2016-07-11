import { describe, it } from 'mocha'
import { Promise, isNever } from '../src/main'
import assert from 'assert'

describe('empty', function () {
	it('should return never', () => {
		assert(isNever(Promise.empty()))
	})
})
