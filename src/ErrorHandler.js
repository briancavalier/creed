import { silenceError, isHandled } from './inspect'
import { attachTrace } from './trace'

const UNHANDLED_REJECTION = 'unhandledRejection'
const HANDLED_REJECTION = 'rejectionHandled'

export default class ErrorHandler {
  constructor (emitEvent, reportError) {
    this.unhandled = new Set()
    this.handled = new Set()
    this.emit = emitEvent
    this.reportError = reportError
    this.timer = null
  }

  track (rejected) {
    attachTrace(rejected.value, rejected.context)
    this._schedule()
    this.unhandled.add(rejected)
  }

  untrack (rejected) {
    silenceError(rejected)
    this._schedule()
    this.handled.add(rejected)
  }

  _schedule () {
    /* istanbul ignore else */
    if (this.timer === null) {
      this.timer = setTimeout(reportErrors, 1, this)
    }
  }
}

function reportErrors (errorHandler) {
  errorHandler.timer = null

  reportUnhandled(errorHandler.emit, errorHandler.reportError, errorHandler.unhandled)
  errorHandler.unhandled.clear()

  reportHandled(errorHandler.emit, errorHandler.handled)
  errorHandler.handled.clear()
}

function reportUnhandled (emit, reportError, unhandled) {
  forEach(r => {
    if (!isHandled(r) && !emit(UNHANDLED_REJECTION, r, r.value)) {
      reportError(r)
    }
  }, unhandled)
}

function reportHandled (emit, handled) {
  forEach(r => emit(HANDLED_REJECTION, r, r.value), handled)
}

function forEach (f, s) {
  const iter = s[Symbol.iterator]()

  while (true) {
    const step = iter.next()
    if (step.done) {
      break
    }
    f(step.value)
  }
}
