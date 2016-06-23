import Action from './Action'

export default function then (f, r, p, promise) {
	if (promise.token != null && promise.token.requested) {
		return promise.token.getRejected()
	}
	p._when(new Then(f, r, promise))
	return promise
}

class Then extends Action {
	constructor (f, r, promise) {
		super(promise)
		this.f = f
		this.r = r
	}

	destroy () {
		super.destroy()
		this.f = null
		this.r = null
	}

	fulfilled (p) {
		this.runThen(this.f, p)
	}

	rejected (p) {
		return this.runThen(this.r, p)
	}

	runThen (f, p) {
		const token = this.promise.token
		const hasHandler = typeof f === 'function'
		if (hasHandler) {
			this.tryCall(f, p.value)
		} else {
			this.promise._become(p)
		}
		if (token != null) token._unsubscribe(this)
		return hasHandler
	}

	handle (result) {
		this.promise._resolve(result)
	}
}
