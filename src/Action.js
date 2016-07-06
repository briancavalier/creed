export default class Action {
	constructor (promise) {
		this.promise = promise // the Future which this Action tries to resolve
                               // when null, the action is cancelled and won't be executed
		const token = promise.token
		if (token != null) {
			// assert: !token.requested
			token._subscribe(this)
		}
	}

	destroy () {
		this.promise = null
	}

	cancel (p) {
		/* istanbul ignore else */
		if (this.promise._isResolved()) { // promise checks for cancellation itself
			this.destroy()
		}
	}

	// default onFulfilled action
	/* istanbul ignore next */
	fulfilled (p) {
		this.put(p)
	}

	// default onRejected action
	rejected (p) {
		this.put(p)
		return false
	}

	tryCall (f, x) {
		/* eslint complexity:[2,5], no-labels:0, no-lone-blocks:0 */
		call: {
			let result
			try {
				result = f(x)
			} catch (e) {
				if (this.promise == null) return // got cancelled during call
				this.promise._reject(e)
				break call
			} /* else */ {
				if (this.promise == null) return // got cancelled during call
				this.handle(result)
			}
		}
		const token = this.promise.token
		if (token != null) token._unsubscribe(this)
	}

	put (p) {
		const promise = this.promise
		const token = promise.token
		promise._become(p)
		if (token != null) token._unsubscribe(this)
	}
}
