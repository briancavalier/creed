import { silenceError } from './Promise' // deferred
import { isHandled } from './inspect'

export const UNHANDLED_REJECTION = 'unhandledRejection'
export const HANDLED_REJECTION = 'rejectionHandled'

export default class ErrorHandler {
	constructor (emitEvent, reportError) {
		this.errors = []
		this.emit = emitEvent
		this.reportError = reportError
		this.report = () => this._reportErrors()
	}

	track (e) {
		if (!this.emit(UNHANDLED_REJECTION, e, e.value)) {
			/* istanbul ignore else */
			if (this.errors.length === 0) {
				setTimeout(this.report, 1)
			}
			this.errors.push(e)
		}
	}

	untrack (e) {
		silenceError(e)
		this.emit(HANDLED_REJECTION, e)
	}

	_reportErrors () {
		try {
			this._reportAll(this.errors)
		} finally {
			this.errors.length = 0
		}
	}

	_reportAll (errors) {
		for (let i = 0; i < errors.length; ++i) {
			const e = errors[i]
			/* istanbul ignore else */
			if (!isHandled(e)) {
				this.reportError(e)
			}
		}
	}
}
