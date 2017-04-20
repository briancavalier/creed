import { describe, it } from 'mocha'
import { fulfill, delay, reject } from '../src/main'
import { assertSame, rejectsWith } from './lib/test-util'
import { is } from '@briancavalier/assert'

describe('map', () => {
  it('should satisfy identity', () => {
    const u = fulfill({})
    return assertSame(u.map(x => x), u)
  })

  it('should satisfy composition', () => {
    const f = x => x + 'f'
    const g = x => x + 'g'
    const u = fulfill('e')

    return assertSame(u.map(x => f(g(x))), u.map(g).map(f))
  })

  it('should reject if f throws', () => {
    const expected = new Error()
    return rejectsWith(is(expected), delay(1).map(() => { throw expected }))
  })

  it('should not map rejection', () => {
    const expected = new Error()
    return rejectsWith(is(expected), delay(1, expected).then(reject).map(() => null))
  })
})
