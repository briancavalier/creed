import { isObject } from './util'
import { CancellableAction } from './Action'

export default function chain (f, p, promise) {
	if (promise.token != null && promise.token.requested) {
		return promise.token.getCancelled()
	}
	p._when(promise._whenToken(new Chain(f, promise)))
	return promise
}

class Chain extends CancellableAction {
	handle (y) {
		if (!(isObject(y) && typeof y.then === 'function')) {
			this.end()._reject(new TypeError('f must return a promise'))
		} else {
			this.promise._resolve(y, this)
		}
	}
}
