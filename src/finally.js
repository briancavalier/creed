import { resolve } from './Promise'
import { isRejected, isFulfilled } from './inspect'
import { CancellableAction } from './Action'

export default function _finally (f, p, promise) {
	// assert: promise.token == null
	if (typeof f !== 'function') throw new TypeError('finally does require a callback function')
	p._when(new Final(f, p.token, promise))
	return promise
}

class Final extends CancellableAction {
	constructor (f, t, promise) {
		super(f, promise)
		this.token = t
		if (t != null) {
			t._subscribe(this)
		}
	}

	/* istanbul ignore next */
	destroy () { // possibly called when unsubscribed from the token
		this.token = null
	}

	cancel (p) {
		/* istanbul ignore if */
		if (this.token == null) return
		this.token = null
		const promise = this.tryFin(p)
		this.promise = null // prevent cancelled from running
		return promise
	}

	fulfilled (p) {
		this.settled(p, this.f)
	}

	rejected (p) {
		return this.settled(p, p)
	}

	settled (p, res) {
		if (typeof this.f === 'function') { // f is the callback
			const token = this.token
			if (token) {
				token._unsubscribe(this)
				this.token = null
			}
			this.tryFin(p)
			return true
		} else { // f held the original result
			this.promise.__become(res)
			this.promise = this.f = null
			return false
		}
	}

	tryFin (p) {
		/* eslint complexity:[2,5] */
		const orig = this.promise
		if (!this.tryCall(this.f, p)) {
			// assert: orig !== this.promise
			// assert: !isRejeced(this.promise)
			if (isFulfilled(this.promise)) {
				orig._become(p)
			} else {
				this.f = p
				this.promise._runAction(this)
				this.promise = orig
			}
			return this.promise
		}
		return orig
	}

	handle (result) {
		const p = resolve(result)
		if (isRejected(p)) {
			this.promise._become(p)
		} else {
			this.promise = p
		}
	}

	end () {
		return this.promise
	}
}
