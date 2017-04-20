const noop = () => {}

// WARNING: shared mutable notion of "current context"
let _currentContext
let _createContext = noop

// Get the current context
export const peekContext = () => _currentContext

// Append a new context to the current, and set the current context
// to the newly appended one
export const pushContext = (at, tag) =>
  _createContext(_currentContext, at, tag)

// Set the current context to the provided one, returning the
// previously current context (which makes it easy to swap back
// to it)
export const swapContext = context => {
  const previousContext = _currentContext
  _currentContext = context
  return previousContext
}

// Enable context tracing.  Must provide:
// createContext :: c -> Function -> String -> c
// Given the current context, and a function and string tag representing a new context,
// return a new current context
// initialContext :: c
// An initial current context
export const traceAsync = (createContext, initialContext) => {
  _createContext = createContext
  _currentContext = initialContext
}

// Enable default context tracing
export const enableAsyncTraces = () =>
  traceAsync(createContext, undefined)

// Disable context tracing
export const disableAsyncTraces = () =>
  traceAsync(noop, undefined)

// ------------------------------------------------------
// Default context tracing

export const createContext = (currentContext, at, tag) =>
  new Context(currentContext, tag || at.name, at)

export const captureStackTrace = Error.captureStackTrace || noop

export class Context {
  constructor (next, tag, at) {
    this.next = next
    this.tag = tag
    captureStackTrace(this, at)
  }

  toString () {
    return this.tag ? ` from ${this.tag}:` : ' from previous context:'
  }
}

// ------------------------------------------------------
// Default context formatting

// If context provided, attach an async trace for it.
// Otherwise, do nothing.
export const attachTrace = (e, context) =>
  context != null ? formatTrace(e, context) : e

// If e is an Error, attach an async trace to e for the provided context
// Otherwise, do nothing
export function formatTrace (e, context) {
  if (e instanceof Error && !('_creed$OriginalStack' in e)) {
    e._creed$OriginalStack = e.stack
    e.stack = formatContext(elideTrace(e.stack), context)
  }
  return e
}

// Fold context list into a newline-separated, combined async trace
export function formatContext (trace, context) {
  if (context == null) {
    return trace
  }
  const s = elideTrace(context.stack)
  return formatContext(s.indexOf(' at ') < 0 ? trace : (trace + '\n' + s), context.next)
}

export const elideTraceRx =
  /\s*at\s.*(creed[\\/](src|dist)[\\/]|internal[\\/]process[\\/]|\((timers|module)\.js).+:\d.*/g

// Remove internal stack frames
export const elideTrace = stack =>
  typeof stack === 'string' ? stack.replace(elideTraceRx, '') : ''
