import { describe, it } from 'mocha'
import { eq, is, fail } from '@briancavalier/assert'
import { fulfill, reject, future, delay } from '../src/main'
import { assertSame, assertSameRejected, rejectsWith } from './lib/test-util'

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

  it('should map future fulfilled value', () => {
    const { resolve, promise } = future()
    resolve(delay(1, 1))
    return promise.bimap(fail, x => x + 1)
      .then(eq(2))
  })

  it('should map future rejected value', () => {
    const { resolve, promise } = future()
    resolve(delay(1, 1).then(reject))
    return rejectsWith(eq(2), promise.bimap(x => x + 1, id))
  })

  it('should reject if f throws', () => {
    const p = fulfill()
    const expected = {}
    const fail = {}
    return rejectsWith(is(expected), p.bimap(e => fail, () => { throw expected }))
  })

  it('should reject if r throws', () => {
    const p = reject()
    const expected = {}
    return rejectsWith(is(expected), p.bimap(() => { throw expected }, id))
  })

  it('should fulfill with returned promise verbatim', () => {
    const p = fulfill()
    const expected = fulfill()
    return p.bimap(fail, () => expected)
      .then(is(expected))
  })

  it('should reject with returned promise verbatim', () => {
    const p = reject()
    const expected = fulfill()
    // NOTE: Can't use rejects() or rejectsWith() here since they
    // use then() internally, which would absorb the expected promise
    // returned from the mapping function here
    return p.bimap(() => expected, id)
      .then(fail, is(expected))
  })
})
