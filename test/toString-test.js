import { describe, it } from 'mocha'
import { fulfill, reject, Future, never } from '../src/Promise'
import { getValue, getReason } from '../src/inspect'
import { eq } from '@briancavalier/assert'

describe('toString', () => {
  it('should indicate fulfilled promise', () => {
    let p = fulfill('a')
    eq(`[object Promise { fulfilled: ${getValue(p)} }]`,
            p.toString())
  })

  it('should indicate rejected promise', () => {
    let p = reject(new Error('a'))
    eq(`[object Promise { rejected: ${getReason(p)} }]`,
            p.toString())
  })

  it('should indicate pending promise', () => {
    let p = new Future()
    eq('[object Promise { pending }]', p.toString())
  })

  it('should indicate never', () => {
    let p = never()
    eq('[object Promise { never }]', p.toString())
  })
})
