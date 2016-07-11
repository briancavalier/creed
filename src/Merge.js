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
		promise._become(p)
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
