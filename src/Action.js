import Handle from './Handle'

export default class Action extends Handle {
	constructor (promise) {
		super(null)
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
		try {
			result = f(x)
		} catch (e) {
			this.promise._reject(e)
			return
		} // else
		this.handle(result)
	}

	run () {
		this.ref._runAction(this)
		super.run()
	}
}
