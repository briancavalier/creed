// istanbul ignore next
'use strict'

export default class TimeoutError extends Error {
	constructor (message) {
		super()
		this.message = message
		this.name = TimeoutError.name
		/* istanbul ignore else */
		if (typeof Error.captureStackTrace === 'function') {
			Error.captureStackTrace(this, TimeoutError)
		}
	}
}
