import { never } from './Promise' // deferred
import CancelReason from './CancelReason'

export default class Race {
	valueAt (x, i, promise) {
		promise._fulfill(x)
	}

	fulfillAt (p, i, promise) {
		const token = promise.token
		promise._become(p)
		token._cancel(new CancelReason('result is already fulfilled'))
	}

	rejectAt (p, i, promise) {
		const token = promise.token
		promise._become(p)
		token._cancel(new CancelReason('result is already rejected', p.value))
	}

	complete (total, promise) {
		if (total === 0) {
			promise._become(never())
		}
	}
}
