import { describe, it } from 'mocha'
import { traceContext, pushContext, swapContext, peekContext, formatTrace, attachTrace } from '../src/trace'
import { is, eq, assert } from '@briancavalier/assert'

describe('trace', () => {
  describe('pushContext', () => {
    it('should return expected context', () => {
      const createContext = (context, at, tag) => ({ context, at, tag })
      const initialContext = {}
      const at = () => {}
      const tag = `${Math.random()}`

      traceContext(createContext, initialContext)
      const actual = pushContext(at, tag)

      is(initialContext, actual.context)
      is(at, actual.at)
      eq(tag, actual.tag)
    })
  })

  describe('swapContext', () => {
    it('should return expected context', () => {
      const createContext = (context, at, tag) => ({ context, at, tag })
      const initialContext = {}
      const at = () => {}
      const tag = `${Math.random()}`

      traceContext(createContext, initialContext)

      const context1 = pushContext(at, tag)

      const context0 = swapContext(context1)

      is(initialContext, context0)

      const actual = swapContext(context0)

      is(context1, actual)
    })
  })

  describe('peekContext', () => {
    it('should return current context', () => {
      const createContext = () => {}
      const initialContext = {}
      const otherContext = {}

      traceContext(createContext, initialContext)

      is(initialContext, peekContext())

      swapContext(otherContext)

      is(otherContext, peekContext())
    })
  })

  describe('enableContextTracing', () => {

  })

  describe('disableContextTracing', () => {

  })

  describe('attachTrace', () => {
    it('should not modify stack when context is undefined', () => {
      const expected = new Error()
      const expectedStack = expected.stack
      const actual = attachTrace(undefined, expected)

      is(expected, actual)
      eq(expectedStack, actual.stack)
    })

    it('should modify stack when context is provided', () => {
      const expected = new Error()
      const unexpectedStack = expected.stack
      const context = new Error()

      const actual = attachTrace(context, expected)

      is(expected, actual)
      assert(unexpectedStack !== actual.stack)
    })
  })

  describe('formatTrace', () => {
    it('should return empty string for missing context', () => {
      eq('', formatTrace(undefined))
    })

    it('should retain expected frames from all contexts', () => {

    })
  })

  describe('elideTrace', () => {
    it('should retain only expected frames', () => {

    })
    it('should return empty when all frames elided', () => {

    })
  })
})
