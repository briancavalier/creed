import { CancellableAction } from './Action'

export default function trifurcate (f, r, c, p, promise) {
	// assert: promise.token == null
	p._when(new Trifurcation(f, r, c, promise))
	return promise
}

class Trifurcation extends CancellableAction {
	constructor (f, r, c, promise) {
		super(f, promise)
		this.r = r
		this.c = c
	}

	fulfilled (p) {
		this.runTee(this.f, p)
	}

	rejected (p) {
		return this.runTee(this.r, p)
	}

	cancelled (p) {
		if (typeof this.c !== 'function') {
			this.end()._reject(p.value)
		} else {
			this.runTee(this.c, p)
		}
	}

	runTee (f, p) {
		/* eslint complexity:[2,4] */
		const hasHandler = (this.f != null || this.r != null || this.c != null) && typeof f === 'function'
		if (hasHandler) {
			this.r = null
			this.c = null
			this.tryCall(f, p.value)
		} else {
			this.put(p)
		}
		return hasHandler
	}

	end () {
		const promise = this.promise
		this.promise = null
		return promise
	}
}
