import { silenceError, isHandled } from './inspect'
import { attachTrace } from './trace'

const UNHANDLED_REJECTION = 'unhandledRejection'
const HANDLED_REJECTION = 'rejectionHandled'

export default class ErrorHandler {
	constructor (emitEvent, reportError) {
		this.rejections = []
		this.emit = emitEvent
		this.reportError = reportError
	}

	track (rejected) {
		const e = attachTrace(rejected.value, rejected.context)

		if (!this.emit(UNHANDLED_REJECTION, rejected, e)) {
			/* istanbul ignore else */
			if (this.rejections.length === 0) {
				setTimeout(reportErrors, 1, this.reportError, this.rejections)
			}
			this.rejections.push(rejected)
		}
	}

	untrack (rejected) {
		silenceError(rejected)
		this.emit(HANDLED_REJECTION, rejected)
	}
}

function reportErrors (report, rejections) {
	try {
		reportAll(rejections, report)
	} finally {
		rejections.length = 0
	}
}

function reportAll (rejections, report) {
	for (let i = 0; i < rejections.length; ++i) {
		const rejected = rejections[i]
		/* istanbul ignore else */
		if (!isHandled(rejected)) {
			report(rejected)
		}
	}
}
