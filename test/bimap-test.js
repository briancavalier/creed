import { describe, it } from 'mocha'
import { fulfill, reject } from '../src/main'
import { assertSame, assertSameRejected } from './lib/test-util'

const id = x => x

const f = x => x + 'f'
const g = x => x + 'g'
const h = x => x + 'h'
const i = x => x + 'i'

describe('bimap', () => {
  it('should satisfy identity for fulfilled', () => {
    const p = fulfill({})
    return assertSame(p.bimap(id, id), p)
  })

  it('should satisfy identity for rejected', () => {
    const p = reject({})
    return assertSameRejected(p.bimap(id, id), p)
  })

  it('should satisfy composition for fulfilled', () => {
    const p = fulfill('e')
    return assertSame(p.bimap(a => f(g(a)), b => h(i(b))), p.bimap(g, i).bimap(f, h))
  })

  it('should satisfy composition for rejected', () => {
    const p = reject('e')
    return assertSameRejected(p.bimap(a => f(g(a)), b => h(i(b))), p.bimap(g, i).bimap(f, h))
  })

})
