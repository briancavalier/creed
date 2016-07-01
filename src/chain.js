import { isObject } from './util'
import Action from './Action'

export default function chain (f, p, promise) {
	p._when(new Chain(f, promise))
	return promise
}

class Chain extends Action {
	constructor (f, promise) {
		super(promise)
		this.f = f
	}

	fulfilled (p) {
		this.tryCall(this.f, p.value)
	}

	handle (y) {
		if (!(isObject(y) && typeof y.then === 'function')) {
			this.promise._reject(new TypeError('f must return a promise'))
		}

		this.promise._resolve(y)
	}
}
