import { describe, it } from 'mocha'
import { fulfill, reject, delay, coroutine } from '../src/main'
import { eq, is } from '@briancavalier/assert'
import { rejectsWith } from './lib/test-util'

describe('coroutine', function () {
  it('should allow parameters', () => {
    const f = coroutine(function * (a, b) {
      eq(a, 'a')
      eq(b, 'b')
    })

    return f('a', 'b')
  })

  it('should continue on fulfilled promises', () => {
    const f = coroutine(function * (a, b) {
      return (yield delay(1, a)) + (yield fulfill(b))
    })

    return f('a', 'b').then(eq('ab'))
  })

  it('should throw on rejected promises', () => {
    const expected = new Error()
    const f = coroutine(function * (a) {
      try {
        yield reject(a)
      } catch (e) {
        return e
      }
    })

    return f(expected)
      .then(is(expected))
  })

  it('should reject on uncaught exception', () => {
    const expected = new Error()
    const f = coroutine(function * (a) {
      yield reject(a)
    })

    return rejectsWith(is(expected), f(expected))
  })
})
