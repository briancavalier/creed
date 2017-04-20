import { describe, it } from 'mocha'
import { fulfill } from '../src/main'
import { assertSame } from './lib/test-util'

describe('ap', () => {
  it('should satisfy identity', () => {
    const v = fulfill({})
    return assertSame(fulfill(x => x).ap(v), v)
  })

  it('should satisfy composition', () => {
    const u = fulfill(x => 'u' + x)
    const v = fulfill(x => 'v' + x)
    const w = fulfill('w')

    return assertSame(
      fulfill(f => g => x => f(g(x))).ap(u).ap(v).ap(w),
      u.ap(v.ap(w))
    )
  })

  it('should satisfy homomorphism', () => {
    const f = x => x + 'f'
    const x = 'x'
    return assertSame(fulfill(f).ap(fulfill(x)), fulfill(f(x)))
  })

  it('should satisfy interchange', () => {
    const f = x => x + 'f'
    const u = fulfill(f)
    const y = 'y'

    return assertSame(u.ap(fulfill(y)), fulfill(f => f(y)).ap(u))
  })
})
