import { noop } from './util'
import { reject } from './Promise'

export default class Action {
	constructor (promise) {
		// the Future which this Action tries to resolve
		// when null, the action is cancelled and won't be executed
		this.promise = promise
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
	fulfilled (p) {
		this.put(p)
	}

	// default onRejected action
	rejected (p) {
		this.put(p)
		return false
	}

	// default onCancelled action
	cancelled (p) {
		reject(p.near().value)._runAction(this)
	}

	// when this.promise is to be settled (possible having awaited the result)
	put (p) {
		// assert: isSettled(p) || p.token === this.promise.token
		// asssert: this.promise != null
		this.end().__become(p)
	}

	end () {
		const promise = this.promise
		const token = promise.token
		this.promise = null
		if (token != null) token._unsubscribe(this)
		return promise
	}
}

const sentinel = noop // Symbol('currently executing')

export class CancellableAction extends Action {
	constructor (f, promise) {
		super(promise)
		// the function that produces the resolution result for the promise
		// when null, the function has been executed but the promise might still get cancelled
		this.f = f
	}

	destroy () {
		this.promise = null
		this.f = null
	}

	cancel (results) {
		if (this.promise._isResolved()) { // promise checks for cancellation itself
			if (this.f !== sentinel) { // not currently running
				this.destroy()
			}
			// otherwise keep the cancelled .promise so that it stays usable in handle()
			// and ignores whatever is done with the f() result
			return true
		}
		return false
	}

	fulfilled (p) {
		if (this.f) {
			this.tryCall(this.f, p.value)
		} else {
			this.put(p)
		}
	}

	tryCall (f, x) {
		this.f = sentinel
		let result
		try {
			result = f(x)
		} catch (e) {
			this.f = null
			this.end()._reject(e)
			return
		}
		this.f = null
		return this.handle(result)
	}

	handle (p) {
		this.promise._resolve(p, this)
	}
}
