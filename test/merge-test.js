import { describe, it } from 'mocha'
import { merge, resolve, reject } from '../src/main'
import { eq, is, assert } from '@briancavalier/assert'
import { rejectsWith } from './lib/test-util'

describe('merge', () => {
  it('should call merge function later', () => {
    let ok = false
    let p = merge(() => assert(ok))
    ok = true

    return p
  })

  it('should call merge function with values', () => {
    return merge((x, y) => {
      eq(x, 1)
      eq(y, 2)
      return x + y
    }, 1, 2).then(eq(3))
  })

  it('should call merge function with fulfilled values', () => {
    return merge((x, y) => {
      eq(x, 1)
      eq(y, 2)
      return x + y
    }, resolve(1), resolve(2)).then(eq(3))
  })

  it('should reject if input contains rejection', () => {
    const expected = new Error()
    const p = merge(() => assert(false), 1, reject(expected))
    return rejectsWith(is(expected), p)
  })

  it('should reject if merge function throws', () => {
    const expected = {}
    const p = merge(() => {
      throw expected
    }, resolve(1), resolve(2))

    return rejectsWith(is(expected), p)
  })
})
