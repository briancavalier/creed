export default class Action {
	constructor (promise) {
		this.promise = promise
	}

	// default onFulfilled action
	/* istanbul ignore next */
	fulfilled (p) {
		this.promise._become(p)
	}

	// default onRejected action
	rejected (p) {
		this.promise._become(p)
		return false
	}
}
