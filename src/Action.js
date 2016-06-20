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

	tryCall (f, x) {
		let result
		// test if `f` (and only it) throws
		try {
			result = f(x)
		} catch (e) {
			this.promise._reject(e)
			return
		} // else
		this.handle(result)
	}
}
