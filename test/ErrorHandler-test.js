import { describe, it } from 'mocha'
import ErrorHandler from '../src/ErrorHandler'
import { is, eq, fail } from '@briancavalier/assert'
import { HANDLED } from '../src/state'

function fakeError (value) {
  return {
    value: value,
    _state: 0,
    state () { return this._state },
    _runAction () { this._state |= HANDLED }
  }
}

describe('ErrorHandler', () => {
  describe('track', () => {
    it('should emit event eventually', (done) => {
      const value = {}
      const expected = fakeError(value)

      function verify (event, e, error) {
        is(e, expected)
        is(error, value)
        done()
        return true
      }

      const eh = new ErrorHandler(verify, fail)
      eh.track(expected)
    })

    it('should report error later', done => {
      const value = {}
      const expected = fakeError(value)
      function verify (e) {
        is(e, expected)
        is(e.value, value)
        done()
      }

      const eh = new ErrorHandler(() => false, verify)
      eh.track(expected)
    })
  })

  describe('untrack', () => {
    it.only('should emit event eventually', (done) => {
      const value = {}
      const expected = fakeError(value)

      function verify (event, e) {
        is(e, expected)
        is(e.value, value)
        done()
        return true
      }

      const eh = new ErrorHandler(verify, fail)
      eh.track(expected)
      eh.untrack(expected)
    })

    it('should silence error', () => {
      const value = {}
      const expected = fakeError(value)

      const eh = new ErrorHandler(() => true, fail)
      eh.untrack(expected)

      eq(expected.state(), HANDLED)
    })
  })
})
