import { isObject } from './util'
import Action from './Action'

export default function chain (f, p, promise) {
	if (promise.token != null && promise.token.requested) {
		return promise.token.getRejected()
	}
	p._when(new Chain(f, promise))
	return promise
}

class Chain extends Action {
	constructor (f, promise) {
		super(promise)
		this.f = f
	}

	destroy () {
		super.destroy()
		this.f = null
	}

	fulfilled (p) {
		const token = this.promise.token
		this.tryCall(this.f, p.value)
		if (token != null) token._unsubscribe(this)
	}

	handle (y) {
		if (!(isObject(y) && typeof y.then === 'function')) {
			this.promise._reject(new TypeError('f must return a promise'))
		}

		this.promise._resolve(y)
	}
}
