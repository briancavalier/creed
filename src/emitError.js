import { isNode } from './env'
import { noop } from './util'
import { UNHANDLED_REJECTION } from './ErrorHandler'

let emitError
/*global process, self, CustomEvent*/
// istanbul ignore else */
if (isNode && typeof process.emit === 'function') {
	// Returning falsy here means to call the default reportRejection API.
	// This is safe even in browserify since process.emit always returns
	// falsy in browserify:
	// https://github.com/defunctzombie/node-process/blob/master/browser.js#L40-L46
	emitError = function emit (type, error) {
		return type === UNHANDLED_REJECTION
			? process.emit(type, error.value, error)
			: process.emit(type, error)
	}
} else if (typeof self !== 'undefined' && typeof CustomEvent === 'function') {
	emitError = (function (self, CustomEvent) {
		try {
			let usable = new CustomEvent(UNHANDLED_REJECTION) instanceof CustomEvent
			if (!usable) return noop
		} catch (e) {
			return noop
		}

		return function emit (type, error) {
			const ev = new CustomEvent(type, {
				detail: {
					reason: error.value,
					promise: error
				},
				bubbles: false,
				cancelable: true
			})

			return !self.dispatchEvent(ev)
		}
	}(self, CustomEvent))
} else {
	emitError = noop
}

export default emitError
