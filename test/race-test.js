import { describe, it } from 'mocha'
import { race, resolve, reject, never } from '../src/main'
import { isNever } from '../src/inspect'
import { throwingIterable, assertTypeError, rejectsWith } from './lib/test-util'
import { is, eq, assert } from '@briancavalier/assert'

describe('race', () => {
  it('should reject if iterator throws', () => {
    const expected = new Error()
    return rejectsWith(is(expected), race(throwingIterable(expected)))
  })

  it('should return never when input is empty', () => {
    assert(isNever(race([])))
  })

  it('should reject with a TypeError when passed non-iterable', () => {
    return rejectsWith(assertTypeError, race(123))
  })

  it('should be identity for 1 element when value', () => {
    return race(new Set([1])).then(eq(1))
  })

  it('should be identity for 1 element when fulfilled', () => {
    return race(new Set([resolve(1)])).then(eq(1))
  })

  it('should be identity for 1 element when rejected', () => {
    const expected = new Error()
    return rejectsWith(is(expected), race(new Set([reject(expected)])))
  })

  it('should fulfill when winner fulfills', () => {
    return race([resolve(), never()])
  })

  it('should reject when winner rejects', () => {
    const expected = new Error()
    return rejectsWith(is(expected), race([reject(expected), never()]))
  })
})
