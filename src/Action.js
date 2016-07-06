import { Future } from './Promise'

let sentinel = null
const empty = []

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
		if (this.promise._isResolved()) { // promise checks for cancellation itself
			if (this.promise === sentinel) {
				this.destroy()
				this.promise = new Future()
				return this.promise
			} else {
				this.destroy()
				return empty
			}
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
		const original = sentinel = this.promise
		let result
		try {
			result = f(x)
		} catch (e) {
			sentinel = null
			this.promise._reject(e)
			return this.promise === original
		}
		sentinel = null
		this.handle(result)
		return this.promise === original
	}

	tryUnsubscribe () {
		const token = this.promise.token
		if (token != null) token._unsubscribe(this)
		this.promise = null
	}

	put (p) {
		const promise = this.promise
		const token = promise.token
		promise._become(p)
		if (token != null) token._unsubscribe(this)
		this.promise = null
	}
}
