import { describe, it } from 'mocha'
import { fulfill, reject } from '../src/main'
import { silenceError, getValue } from '../src/inspect'
import { is } from '@briancavalier/assert'

describe('fulfill', () => {
  it('should wrap value', () => {
    const x = {}
    return fulfill(x).then(is(x))
  })

  it('should be immediately fulfilled', () => {
    const x = {}
    is(x, getValue(fulfill(x)))
  })

  it('should wrap promise', () => {
    const x = fulfill({})
    return fulfill(x).map(is(x))
  })

  it('should wrap rejected promise', () => {
    const x = reject({})
    silenceError(x)
    return fulfill(x).map(is(x))
  })

  it('catch should be identity', () => {
    const p = fulfill(true)
    is(p, p.catch())
  })

  it('then should be identity without f callback', () => {
    const p = fulfill(true)
    is(p, p.then())
  })
})
