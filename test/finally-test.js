import { describe, it } from 'mocha'
import { fulfill, reject, never } from '../src/main'
import { rejectsWith } from './lib/test-util'
import { eq, is } from '@briancavalier/assert'

describe('finally', () => {
  describe('given never', () => {
    it('should be identity', () => {
      const p = never()
      is(p, p.finally(() => {}))
    })
  })

  describe('given a finally handler that is not a function', () => {
    it('given a fulfilled promise P it should return P', () => {
      const p = fulfill()
      is(p, p.finally())
    })

    it('given a rejected promise P it should return P', () => {
      const p = reject(new Error())
      is(p, p.finally())
    })
  })
  describe('given finally handler that returns a non-promise', () => {
    it(`given a fulfilled promise P it should execute finally handler and fulfill with P's value`, () => {
      const x = Math.random()
      const p = fulfill(x)
      return p.finally(() => x + 1)
        .then(eq(x))
    })

    it(`given a fulfilled promise P it should execute finally handler and fulfill with P's value`, () => {
      const e = new Error()
      const p = reject(e)
      return rejectsWith(is(e), p.finally(() => null))
    })
  })

  describe('given finally handler that throws synchronously', () => {
    it(`given a fulfilled promise P it should execute finally handler and fulfill with P's value`, () => {
      const e = new Error()
      const handler = () => {
        throw e
      }
      const p = fulfill(Math.random())
      return rejectsWith(is(e), p.finally(handler))
    })

    it(`given a fulfilled promise P it should execute finally handler and fulfill with P's value`, () => {
      const e = new Error()
      const handler = () => {
        throw e
      }
      const p = reject(new Error())
      return rejectsWith(is(e), p.finally(handler))
    })
  })

  describe('given finally handler that returns a fulfilled promise', () => {
    it(`given a fulfilled promise P it should execute finally handler and fulfill with P's value`, () => {
      const x = Math.random()
      const p = fulfill(x)
      return p.finally(() => fulfill(x + 1))
        .then(eq(x))
    })

    it(`given a fulfilled promise P it should execute finally handler and fulfill with P's value`, () => {
      const e = new Error()
      const p = reject(e)
      return rejectsWith(is(e), p.finally(() => fulfill(null)))
    })
  })

  describe('given finally handler that returns a rejected promise', () => {
    it(`given a fulfilled promise P it should execute finally handler and fulfill with P's value`, () => {
      const e = new Error()
      const handler = () => reject(e)
      const p = fulfill(Math.random())
      return rejectsWith(is(e), p.finally(handler))
    })

    it(`given a fulfilled promise P it should execute finally handler and fulfill with P's value`, () => {
      const e = new Error()
      const handler = () => reject(e)
      const p = reject(new Error())
      return rejectsWith(is(e), p.finally(handler))
    })
  })
})
