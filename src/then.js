import { CancellableAction } from './Action'

export default function then (f, r, p, promise) {
	if (promise.token != null && promise.token.requested) {
		return promise.token.getCancelled()
	}
	p._when(new Then(f, r, promise))
	return promise
}

class Then extends CancellableAction {
	constructor (f, r, promise) {
		super(f, promise)
		this.r = r
	}

	destroy () {
		super.destroy()
		this.r = null
	}

	fulfilled (p) {
		this.runThen(this.f, p)
	}

	rejected (p) {
		return this.runThen(this.r, p)
	}

	runThen (f, p) {
		const hasHandler = (this.f != null || this.r != null) && typeof f === 'function'
		if (hasHandler) {
			this.r = null
			this.tryCall(f, p.value)
		} else {
			this.put(p)
		}
		return hasHandler
	}
}
