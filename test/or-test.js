import { describe, it } from 'mocha'
import { fulfill, delay, reject, never } from '../src/main'
import { silenceError } from '../src/inspect'
import { assertSame } from './lib/test-util'
import { is } from '@briancavalier/assert'

describe('or', function () {
  it('should be identity for fulfill', () => {
    const p = fulfill()
    is(p, p.or(fulfill()))
  })

  it('should be identity for reject', () => {
    const p = reject(new Error())
    silenceError(p)
    is(p, p.or(fulfill()))
  })

  it('should return other for never', () => {
    const p1 = never()
    const p2 = fulfill()
    is(p2, p1.or(p2))
  })

  it('should behave like earlier future', () => {
    const expected = {}
    const p = delay(1, expected).or(delay(10))
    return assertSame(p, fulfill(expected))
  })

  it('should behave like other earlier future', () => {
    const expected = {}
    const p = delay(10).or(delay(1, expected))
    return assertSame(p, fulfill(expected))
  })

  it('should return other with fulfilled', () => {
    const expected = {}
    const p = fulfill(expected)
    return is(delay(10).or(p), p)
  })

  it('should return other with rejected', () => {
    const p = reject(new Error())
    silenceError(p)
    is(delay(10).or(p), p)
  })

  it('should be identity with never', () => {
    const p2 = never()
    const p1 = delay(10)
    is(p1.or(p2), p1)
  })
})
