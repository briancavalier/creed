import { Handle, ShareHandle } from './Handle'

export default class Action extends Handle {
	constructor (promise) {
		super(null) // ref will be set when used as handle
		this.promise = promise
	}

	_concat (action) {
		if (!action._isReused() && (this._isReused() || action instanceof ShareHandle)) {
			return action._concat(this)
		} else {
			return new ShareHandle(this.ref)._concat(this)._concat(action)
		}
	}
	run () {
		const settled = this.ref
		if (this._isReused()) {
			this.ref = null // make action reusable elsewhere
		}
		settled._runAction(this)
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

	tryCallContext (f, c, x) {
		let result
		try {
			result = f.call(c, x)
		} catch (e) {
			this.promise._reject(e)
			return
		} // else
		this.handle(result)
	}
}
