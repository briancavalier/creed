import { describe, it } from 'mocha'
import TaskQueue from '../src/TaskQueue'
import assert from 'assert'

describe('TaskQueue', () => {
	describe('add', () => {
		it('should add task to execute later', done => {
			let i = 0
			function inc () {
				i++
			}

			function verify () {
				assert.equal(i, 2)
				done()
			}

			let t = new TaskQueue()

			t.add({ run: inc })
			t.add({ run: inc })
			t.add({ run: verify })
		})
	})
})
