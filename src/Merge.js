import CancelReason from './CancelReason'

export default class Merge {
	constructor (mergeHandler, results) {
		this.pending = 0
		this.results = results
		this.mergeHandler = mergeHandler
	}

	valueAt (x, i, promise) {
		this.results[i] = x
		this.check(this.pending - 1, promise)
	}

	fulfillAt (p, i, promise) {
		this.valueAt(p.value, i, promise)
	}

	rejectAt (p, i, promise) {
		const token = promise.token
		promise._become(p)
		token._cancel(new CancelReason('result is already rejected', p.value))
	}

	complete (total, promise) {
		this.check(this.pending + total, promise)
	}

	check (pending, promise) {
		this.pending = pending
		if (pending === 0) {
			this.mergeHandler.merge(promise, this.results)
		}
	}
}
