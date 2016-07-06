import { resolve } from './Promise'
import { isRejected, isFulfilled } from './inspect'
import Action from './Action'

export default function _finally (f, p, promise) {
	// assert: promise.token == null
	if (typeof f !== 'function') throw new TypeError('finally does require a callback function')
	p._when(new Final(f, p.token, promise))
	return promise
}

class Final extends Action {
	constructor (f, t, promise) {
		super(promise)
		this.token = t
		if (t != null) {
			t._subscribe(this)
		}
		this.f = f
	}

	/* istanbul ignore next */
	destroy () { // possibly called when unsubscribed from the token
		this.token = null
	}

	cancel (p) {
		/* istanbul ignore if */
		if (this.token == null) return
		this.token = null
		return this.tryFin(p)
	}

	fulfilled (p) {
		this.tryFin(p)
	}

	rejected (p) {
		this.tryFin(p)
		return true // TODO: correctness? track again afterwards?
	}

	tryFin (p) {
		/* eslint complexity:[2,5] */
		const f = this.f
		if (typeof f !== 'function') return this.promise
		this.f = null
		const token = this.token
		if (token) {
			token._unsubscribe(this)
			this.token = null
		}
		const orig = this.promise
		if (!this.tryCall(f, p)) {
			// assert: orig !== this.promise
			// assert: !isRejeced(this.promise)
			if (isFulfilled(this.promise)) {
				orig._become(p)
			} else {
				this.promise._runAction(new Put(p, orig))
			}
		}
		return this.promise
	}

	handle (result) {
		const p = resolve(result)
		if (isRejected(p)) {
			this.promise._become(p)
		} else {
			this.promise = p
		}
	}
}

class Put extends Action {
	constructor (promise, target) {
		super(target)
		this.p = promise
	}

	fulfilled (_) {
		this.put(this.p)
	}
}
