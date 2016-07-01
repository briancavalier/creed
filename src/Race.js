import { never } from './Promise' // deferred

export default class Race {
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
			promise._become(never())
		}
	}
}
