import Action from './Action'

export default function trifurcate (f, r, c, p, promise) {
	// assert: promise.token == null
	// assert: p.token != null
	p._when(new Trifurcation(f, r, c, p.token, promise))
	return promise
}

class Trifurcation extends Action {
	constructor (f, r, c, t, promise) {
		super(promise)
		this.token = t
		t._subscribe(this)
		this.f = f
		this.r = r
		this.c = c
	}

	/* istanbul ignore next */
	destroy () { // possibly called when unsubscribed from the token
		this.token = null
	}

	cancel (p) {
		/* istanbul ignore if */
		if (this.token == null) return
		this.runTee(this.c, p.near())
	}

	fulfilled (p) {
		this.token._unsubscribe(this)
		this.runTee(this.f, p)
	}

	rejected (p) {
		this.token._unsubscribe(this)
		return this.runTee(this.r, p)
	}

	runTee (f, p) {
		this.token = null
		this.f = null
		this.r = null
		this.c = null
		const hasHandler = typeof f === 'function'
		if (hasHandler) {
			this.tryCall(f, p.value)
		} else {
			this.put(p)
		}
		this.promise = null
		return hasHandler
	}

	handle (result) {
		this.promise._resolve(result)
	}
}
