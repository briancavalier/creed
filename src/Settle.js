import { silenceError } from './inspect'

export default class Settle {
	constructor (resolve, results) {
		this.pending = 0
		this.results = results
		this.resolve = resolve
	}

	valueAt (x, i, promise) {
		this.settleAt(this.resolve(x), i, promise)
	}

	fulfillAt (p, i, promise) {
		this.settleAt(p, i, promise)
	}

	rejectAt (p, i, promise) {
		silenceError(p)
		this.settleAt(p, i, promise)
	}

	settleAt (p, i, promise) {
		this.results[i] = p
		this.check(this.pending - 1, promise)
	}

	complete (total, promise) {
		this.check(this.pending + total, promise)
	}

	check (pending, promise) {
		this.pending = pending
		if (pending === 0) {
			promise._fulfill(this.results)
		}
	}
}
