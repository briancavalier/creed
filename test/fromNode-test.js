import { describe, it } from 'mocha'
import { fromNode, all } from '../src/main'
import { is, eq, assert } from '@briancavalier/assert'
import { rejectsWith } from './lib/test-util'

function makefn () {
  return fromNode(function (...args) {
    const last = args.length - 1
    const cb = args[last]
    const a = args.slice(0, last)

    cb(null, a.reduce(append))
  })
}

const append = (a, b) => a + b

describe('fromNode', function () {
  it('should fulfill on success', () => {
    const expected = {}
    const f = fromNode((a, cb) => cb(null, a))

    return f(expected).then(is(expected))
  })

  it('should reject on failure', () => {
    const expected = new Error()
    const f = fromNode((a, cb) => cb(a))

    return rejectsWith(is(expected), f(expected))
  })

  it('should reject if function throws synchronously', () => {
    const expected = new Error()
    const f = fromNode(a => { throw a })

    return rejectsWith(is(expected), f(expected))
  })

  it('should accept zero args', () => {
    const f = fromNode(cb => cb(null, true))

    return f().then(assert)
  })

  it('should accept multiple args', () => {
    const a = []

    a.push(makefn()('a').then(eq('a')))
    a.push(makefn()('a', 'b').then(eq('ab')))
    a.push(makefn()('a', 'b', 'c').then(eq('abc')))
    a.push(makefn()('a', 'b', 'c', 'd').then(eq('abcd')))
    a.push(makefn()('a', 'b', 'c', 'd', 'e').then(eq('abcde')))

    return all(a)
  })
})
