import { resolve, Future } from './Promise'
// import { isFulfilled, isRejected } from './inspect'
import { CancellableAction } from './Action'

export default function _finally (f, p, promise) {
	// assert: promise.token == p.token
	if (typeof f !== 'function') throw new TypeError('finally does require a callback function')
	p._when(p._whenToken(new Final(f, promise)))
	return promise
}

class Final extends CancellableAction {
	destroy () {
		this.promise = null
		// don't destroy f
	}

	cancel (results) {
		super.cancel(null) // cancel the final promise
		if (typeof this.f === 'function') { // yet to be run or currently running
			// assert: this.f === sentinel || this.promise = null
			this.promise = new Future() // create new promise for the cancel result
			if (results) results.push(this.promise)
		} else { // f already ran, .f holds the original now, .promise was the final promise
			// do anything to the f() result?
		}
	}

	fulfilled (p) {
		this.settled(p, this.f)
	}

	rejected (p) {
		return this.settled(p, null)
	}

	cancelled (p) {
		this.runFin(p.near(), null)
	}

	settled (p, orig) {
		if (typeof this.f === 'function') { // f is the callback
			this.runFin(p, p)
			return true
		} else { // f held the original result
			this.put(orig == null ? p : orig)
			this.f = null
			return false
		}
	}

	runFin (p, orig) {
		const res = this.tryCall(this.f, p)
		if (res !== undefined) { // f returned a promise to wait for
			// if (isFulfilled(res)) return this.put(p)
			// if (isRejected(res)) return this.put(res)
			this.f = orig // reuse property to store eventual result
			res._runAction(this)
		} else if (this.promise) { // f returned nothing and didn't throw
			this.put(p)
		}
	}

	handle (result) {
		if (result == null) return
		return resolve(result)
	}
}
