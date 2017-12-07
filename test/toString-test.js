import { Future, fulfill, future, never, reject } from '../src/Promise'
import { describe, it } from 'mocha'
import { getReason, getValue } from '../src/inspect'

import { eq } from '@briancavalier/assert'

const verifyToStringResolved = (resolution) => {
  const { resolve, promise } = future()
  resolve(resolution)
  eq(resolution.toString(), promise.toString())
}

describe('toString', () => {
  it('should indicate fulfilled promise', () => {
    const p = fulfill('a')
    eq(`[object Promise { fulfilled: ${getValue(p)} }]`,
      p.toString())
  })

  it('should indicate rejected promise', () => {
    const p = reject(new Error('a'))
    eq(`[object Promise { rejected: ${getReason(p)} }]`,
      p.toString())
  })

  it('should indicate pending promise', () => {
    const p = new Future()
    eq('[object Promise { pending }]', p.toString())
  })

  it('should indicate resolution for promise resolved to fulfilled', () => {
    verifyToStringResolved(fulfill('a'))
  })

  it('should indicate resolution for promise resolved to fulfilled', () => {
    verifyToStringResolved(reject(new Error('a')))
  })

  it('should indicate never', () => {
    const p = never()
    eq('[object Promise { never }]', p.toString())
  })
})
