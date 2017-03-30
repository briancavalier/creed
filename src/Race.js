import { silenceError } from './inspect'

export default class Race {
	valueAt (x, i, promise) {
		promise._fulfill(x)
	}

	fulfillAt (p, i, promise) {
		promise._become(p)
	}

	rejectAt (p, i, promise) {
		// In the case where the result promise has been resolved
		// need to silence all subsequently seen rejections
		promise._isResolved() ? silenceError(p) : promise._become(p)
	}

	complete (total, promise) {
		if (total === 0) {
			promise._become(promise.constructor.empty())
		}
	}
}
