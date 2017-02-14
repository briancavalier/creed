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

export const attachTrace = (context, e) => {
	if (context !== undefined) {
		e.stack = elideTrace(e.stack) + formatTrace(context)
	}

	return e
}

export const formatTrace = context =>
  context === undefined ? ''
    : elideTrace(context.stack) + formatTrace(context.next)

export const elideTraceRx =
  /\s*at\s.*(creed[\\/](src|dist)[\\/]|internal[\\/]process[\\/]|\((timers|module)\.js).+:\d.*/g

export const elideTrace = stack => {
	const s = stack.replace(elideTraceRx, '')
	return s.indexOf(' at ') < 0 ? '' : '\n' + s
}
