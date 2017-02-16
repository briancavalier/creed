import { describe, it, afterEach } from 'mocha'
import { is, eq, assert, fail } from '@briancavalier/assert'

import { traceAsync, pushContext, swapContext, peekContext, formatContext, attachTrace, captureStackTrace,
createContext, elideTrace, enableAsyncTraces, disableAsyncTraces, Context, formatTrace
} from '../src/trace'

describe('trace', () => {
  afterEach(() => disableAsyncTraces())

  describe('pushContext', () => {
    it('should return expected context', () => {
      const createContext = (context, at, tag) => ({ context, at, tag })
      const initialContext = {}
      const at = () => {}
      const tag = `${Math.random()}`

      traceAsync(createContext, initialContext)
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

      traceAsync(createContext, initialContext)

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

      traceAsync(createContext, initialContext)

      is(initialContext, peekContext())

      swapContext(otherContext)

      is(otherContext, peekContext())
    })
  })

  describe('enableAsyncTraces', () => {
    it('should install default initialContext and createContext', () => {
      enableAsyncTraces()

      const context = pushContext(() => {}, '')

      assert(context instanceof Context)
      eq(undefined, swapContext(context))
      is(context, swapContext(context.next))
    })
  })

  describe('disableAsyncTraces', () => {
    it('should remove context and default createContext', () => {
      const initialContext = {}
      traceAsync(fail, initialContext)
      disableAsyncTraces()

      eq(undefined, pushContext(() => {}, ''))
      eq(undefined, swapContext({}))
    })
  })

  describe('attachTrace', () => {
    it('should not modify stack when context is undefined', () => {
      const expected = new Error()
      const expectedStack = expected.stack
      const actual = attachTrace(expected, undefined)

      is(expected, actual)
      eq(expectedStack, actual.stack)
    })

    it('should modify stack when context is provided', () => {
      const expected = new Error()
      const unexpectedStack = expected.stack
      const context = { stack: `${Math.random()}` }

      const actual = attachTrace(expected, context)

      is(expected, actual)
      assert(unexpectedStack !== actual.stack)
    })
  })

  describe('formatTrace', () => {
    it('should not modify non-Error', () => {
      const expected = {}
      eq({}, formatTrace(expected, {}))
    })

    it('should modify Error only once', () => {
      const expected = new Error()
      expected.stack = ''

      const context1 = { stack: `Test1\n at ${Math.random()}` }
      const context2 = { stack: `Test2\n at ${Math.random()}` }

      const expectedStack = `\n${context1.stack}`

      const actual = formatTrace(expected, context1)

      is(expected, actual)
      eq(expectedStack, actual.stack)
      eq(expectedStack, formatTrace(actual, context2).stack)
    })
  })

  describe('formatContext', () => {
    it('should return initial for missing context', () => {
      const initial = `${Math.random()}`
      eq(initial, formatContext(initial, undefined))
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

      const initial = `${Math.random()}`
      const expected = initial
        + '\nTrace 2:\n'
        + ' at c\n'
        + ' at d\n'
        + 'Trace 1:\n'
        + ' at a\n'
        + ' at b'

      eq(expected, formatContext(initial, context2))
    })
  })

  describe('elideTrace', () => {
    it('should return empty string when stack is empty string', () => {
      eq('', elideTrace(''))
    })

    it('should return empty string when stack is not a string', () => {
      eq('', elideTrace(null))
      eq('', elideTrace(undefined))
      eq('', elideTrace({}))
      eq('', elideTrace(true))
      eq('', elideTrace(false))
      eq('', elideTrace(1))
      eq('', elideTrace(0))
    })

    it('should retain only expected frames', () => {
      const initial = `${Math.random()}\n`
      const trace = initial
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

      eq(initial + ' at a\n at b\n at c\n at d\n', elideTrace(trace))
    })

    it('should return empty when all frames elided', () => {
      const initial = `${Math.random()}\n`
      const trace = initial
        + ' at (creed/src/):1:1\n'
        + ' at (creed\\src\\):1:2\n'
        + ' at (creed/dist/):2:1\n'
        + ' at (creed\\dist\\):2:2\n'
        + ' at (internal/process/):3:1\n'
        + ' at (internal\\process\\):3:2\n'
        + ' at (timers.js):4:1\n'
        + ' at (module.js):4:2\n'

      eq(initial, elideTrace(trace))
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
