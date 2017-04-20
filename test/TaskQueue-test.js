import { describe, it } from 'mocha'
import TaskQueue from '../src/TaskQueue'
import { eq } from '@briancavalier/assert'

describe('TaskQueue', () => {
  describe('add', () => {
    it('should add task to execute later', done => {
      let i = 0
      function inc () {
        i++
      }

      function verify () {
        eq(i, 2)
        done()
      }

      const t = new TaskQueue()

      t.add({ run: inc })
      t.add({ run: inc })
      t.add({ run: verify })
    })
  })
})
