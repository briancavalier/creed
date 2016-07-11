export default class Race {
	constructor (never) {
		this.never = never
	}

	valueAt (x, i, promise) {
		promise._fulfill(x)
	}

	fulfillAt (p, i, promise) {
		promise._become(p)
	}

	rejectAt (p, i, promise) {
		promise._become(p)
	}

	complete (total, promise) {
		if (total === 0) {
			promise._become(this.never())
		}
	}
}
