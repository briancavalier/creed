export default class Action {
	constructor (promise) {
		this.promise = promise // the Future which this Action tries to resolve
                               // when null, the action is cancelled and won't be executed
		const token = promise.token
		if (token != null) {
			token._subscribe(this)
		}
	}

	destroy () {
		this.promise = null
	}

	cancel (p) {
		if (this.promise._isResolved()) { // promise checks for cancellation itself
			this.destroy()
		}
	}

	// default onFulfilled action
	/* istanbul ignore next */
	fulfilled (p) {
		const token = this.promise.token
		this.promise._become(p)
		if (token != null) token._unsubscribe(this)
	}

	// default onRejected action
	rejected (p) {
		const token = this.promise.token
		this.promise._become(p)
		if (token != null) token._unsubscribe(this)
		return false
	}

	tryCall (f, x) {
		let result
		try {
			result = f(x)
		} catch (e) {
			this.promise._reject(e)
			return
		} // else
		this.handle(result)
	}
}
