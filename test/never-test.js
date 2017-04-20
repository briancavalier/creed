import { describe, it } from 'mocha'
import { never, fulfill } from '../src/main'
import { is, eq, fail } from '@briancavalier/assert'

describe('never', () => {
  it('then should be identity', () => {
    const p = never()
    is(p, p.then(fail, fail))
  })

  it('catch should be identity', () => {
    const p = never()
    is(p, p.catch(fail))
  })

  it('map should be identity', () => {
    const p = never()
    is(p, p.map(fail))
  })

  it('bimap should be identity', () => {
    const p = never()
    is(p, p.bimap(fail, fail))
  })

  it('ap should be identity', () => {
    const p = never()
    is(p, p.ap(fulfill()))
  })

  it('chain should be identity', () => {
    const p = never()
    is(p, p.chain(fulfill))
  })

  it('_when should not call action', () => {
    let fail = () => { throw new Error('never._when called action') }
    let action = {
      fulfilled: fail,
      rejected: fail
    }

    eq(undefined, never()._when(action))
  })
})
