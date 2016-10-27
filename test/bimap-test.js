import { describe, it } from 'mocha'
import assert from 'assert'
import { fulfill, reject, future, delay, never } from '../src/main'
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

  it('should map future fulfilled value', () => {
    const { resolve, promise } = future()
    resolve(delay(1, 1))
    return promise.bimap(assert.ifError, x => x + 1)
      .then(x => assert.strictEqual(x, 2))
  })

  it('should map future rejected value', () => {
    const { resolve, promise } = future()
    resolve(delay(1, 1).then(reject))
    return promise.bimap(x => x + 1, id)
      .then(assert.ifError, x => assert.strictEqual(x, 2))
  })

  it('should reject if f throws', () => {
    const p = fulfill()
    const expected = {}
    const fail = {}
    return p.bimap(e => fail, () => { throw expected })
      .then(assert.ifError, x => assert.strictEqual(expected, x))
  })

  it('should reject if r throws', () => {
    const p = reject()
    const expected = {}
    return p.bimap(() => { throw expected }, id)
      .then(assert.ifError, x => assert.strictEqual(expected, x))
  })

  it('should fulfill with returned promise verbatim', () => {
    const p = fulfill()
    const expected = never()
    return p.bimap(assert.ifError, () => expected)
      .then(x => assert.strictEqual(expected, x))
  })

  it('should reject with returned promise verbatim', () => {
    const p = reject()
    const expected = never()
    return p.bimap(() => expected, id)
      .then(assert.ifError, x => assert.strictEqual(expected, x))
  })
})
