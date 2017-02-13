import { describe, it, afterEach } from 'mocha'
import { is, eq, assert, fail } from '@briancavalier/assert'

import { traceContext, pushContext, swapContext, peekContext, formatTrace, attachTrace, captureStackTrace,
createContext, elideTrace, enableContextTracing, disableContextTracing, Context
} from '../src/trace'

describe('trace', () => {
  afterEach(() => disableContextTracing())

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
    it('should install default initialContext and createContext', () => {
      enableContextTracing()

      const context = pushContext(() => {}, '')

      assert(context instanceof Context)
      eq(undefined, swapContext(context))
      is(context, swapContext(context.next))
    })
  })

  describe('disableContextTracing', () => {
    it('should remove context and default createContext', () => {
      const initialContext = {}
      traceContext(fail, initialContext)
      disableContextTracing()

      eq(undefined, pushContext(() => {}, ''))
      eq(undefined, swapContext({}))
    })
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
      const trace1 = 'Trace 1:\n'
        + ' at a\n'
        + ' at (creed/src/):1:1\n'
        + ' at (creed\\src\\):1:2\n'
        + ' at b\n'
        + ' at (internal/process/):3:1\n'
        + ' at (internal\\process\\):3:2'

      const trace2 = 'Trace 2:\n'
        + ' at c\n'
        + ' at (creed/dist/):2:1\n'
        + ' at (creed\\dist\\):2:2\n'
        + ' at d\n'
        + ' at (timers.js):4:1\n'
        + ' at (module.js):4:2'

      const context1 = { stack: trace1, next: undefined }
      const context2 = { stack: trace2, next: context1 }

      const expected = '\nTrace 2:\n'
        + ' at c\n'
        + ' at d\n'
        + 'Trace 1:\n'
        + ' at a\n'
        + ' at b'

      eq(expected, formatTrace(context2))
    })
  })

  describe('elideTrace', () => {
    it('should retain only expected frames', () => {
      const trace = 'Test\n'
        + ' at a\n'
        + ' at (creed/src/):1:1\n'
        + ' at (creed\\src\\):1:2\n'
        + ' at b\n'
        + ' at (creed/dist/):2:1\n'
        + ' at (creed\\dist\\):2:2\n'
        + ' at c\n'
        + ' at (internal/process/):3:1\n'
        + ' at (internal\\process\\):3:2\n'
        + ' at d\n'
        + ' at (timers.js):4:1\n'
        + ' at (module.js):4:2\n'

      eq('\nTest\n at a\n at b\n at c\n at d\n', elideTrace(trace))
    })

    it('should return empty when all frames elided', () => {
      const trace = 'Test\n'
        + ' at (creed/src/):1:1\n'
        + ' at (creed\\src\\):1:2\n'
        + ' at (creed/dist/):2:1\n'
        + ' at (creed\\dist\\):2:2\n'
        + ' at (internal/process/):3:1\n'
        + ' at (internal\\process\\):3:2\n'
        + ' at (timers.js):4:1\n'
        + ' at (module.js):4:2\n'

      eq('', elideTrace(trace))
    })
  })

  describe('createContext', () => {
    it('should create Context with expected next and tag', () => {
      const currentContext = {}
      const at = () => {}
      const tag = `${Math.random()}`

      const actual = createContext(currentContext, at, tag)

      is(currentContext, actual.next)
      eq(tag, actual.tag)
    })
  })

  describe('Context', () => {
    it('should have expected next and tag', () => {
      const next = {}
      const at = () => {}
      const tag = `${Math.random()}`

      const actual = new Context(next, tag, at)

      is(next, actual.next)
      eq(tag, actual.tag)
    })

    it('should have toString containing tag when tag present', () => {
      const next = {}
      const at = () => {}
      const tag = `${Math.random()}`

      const actual = new Context(next, tag, at)
      assert(actual.toString().indexOf(tag) >= 0)
    })

    it('should have default toString when tag missing', () => {
      const next = {}
      const at = () => {}
      const tag = ''

      const actual = new Context(next, tag, at)

      assert(actual.toString().length > 0)
    })
  })

  describe('captureStackTrace', () => {
    it('should be a function', () => {
      assert(typeof captureStackTrace === 'function')
    })
  })
})
