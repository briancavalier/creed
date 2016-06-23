import { silenceError } from './Promise' // deferred
import CancelReason from './CancelReason'

export default class Any {
	constructor () {
		this.pending = 0
	}

	valueAt (x, i, promise) {
		promise._fulfill(x)
	}

	fulfillAt (p, i, promise) {
		const token = promise.token
		promise._become(p)
		token._cancel(new CancelReason('result is already fulfilled'))
	}

	rejectAt (p, i, promise) {
		silenceError(p)
		this.check(this.pending - 1, promise)
	}

	complete (total, promise) {
		this.check(this.pending + total, promise)
	}

	check (pending, promise) {
		this.pending = pending
		if (pending === 0) {
			promise._reject(new RangeError('No fulfilled promises in input'))
		}
	}
}
