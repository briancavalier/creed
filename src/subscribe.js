import Action from './Action'

export function subscribe (f, t, promise) {
	if (promise.token != null && promise.token.requested) {
		return promise.token.getRejected()
	}
	t._subscribe(new Subscription(f, promise))
	return promise
}

export function subscribeOrCall (f, g, t, promise) {
	let sub = new Subscription(f, promise)
	t._subscribe(sub)
	return function call () {
		// TODO: should `g` run despite `t.requested`,
		// or should none run immediately despite `call` having been called?
		if (sub != null && sub.f != null) {
			t._unsubscribe(sub)
			t = sub = null
			if (typeof g === 'function') {
				return g.apply(this, arguments)
			}
		}
	}
}

class Subscription extends Action {
	constructor (f, promise) {
		super(promise)
		this.f = f
	}

	destroy () {
		super.destroy()
		this.f = null
	}

	cancel (p) {
		/* eslint complexity:[2,4] */
		const token = this.promise.token
		const f = this.f
		if (token != null && this.promise._isResolved()) { // promise checks for cancellation itself
			if (f != null) { // avoid destruction in case of reentrancy
				this.destroy()
			}
		} else {
			this.f = null
			this.tryCall(f, p.near().value)
			if (token != null) token._unsubscribe(this)
			return this.promise
		}
	}

	handle (result) {
		this.promise._resolve(result)
	}
}
