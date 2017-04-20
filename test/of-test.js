import { describe, it } from 'mocha'
import { Promise, reject } from '../src/main'
import { silenceError, getValue } from '../src/inspect'
import { is } from '@briancavalier/assert'

describe('of', () => {
  it('should wrap value', () => {
    const x = {}
    return Promise.of(x).then(is(x))
  })

  it('should be immediately fulfilled', () => {
    const x = {}
    is(x, getValue(Promise.of(x)))
  })

  it('should wrap promise', () => {
    const x = Promise.of({})
    return Promise.of(x).then(is(x))
  })

  it('should wrap rejected promise', () => {
    const x = reject(new Error())
    silenceError(x)
    return Promise.of(x).map(is(x))
  })
})
