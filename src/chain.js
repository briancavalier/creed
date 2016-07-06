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
		if (this.tryCall(this.f, p.value)) this.tryUnsubscribe()
	}

	handle (y) {
		if (!(isObject(y) && typeof y.then === 'function')) {
			this.promise._reject(new TypeError('f must return a promise'))
		}

		this.promise._resolve(y)
	}
}
