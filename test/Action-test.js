import { describe, it } from 'mocha'
import { eq, is, assert } from '@briancavalier/assert'

import Action from '../src/Action'

describe('Action', () => {
  it('should have expected promise and context', () => {
    const promise = {}
    const action = new Action(promise)

    is(promise, action.promise)
    assert('context' in action)
  })

  describe('fulfilled', () => {
    it('should make promise become incoming fulfilled promise', () => {
      const expected = {}
      const promise = {
        actual: undefined,
        _become (p) {
          this.actual = p
        }
      }

      const action = new Action(promise)
      action.fulfilled(expected)

      is(expected, promise.actual)
    })
  })

  describe('rejected', () => {
    it('should make promise become incoming rejected promise', () => {
      const expected = {}
      const promise = {
        actual: undefined,
        _become (p) {
          this.actual = p
        }
      }

      const action = new Action(promise)
      action.rejected(expected)

      is(expected, promise.actual)
    })
  })
})
