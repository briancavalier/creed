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
		const promise = this.promise
		if (promise.token != null) {
			const res = super.cancel(p)
			if (res != null) {
				return res
			}
		}
		const f = this.f
		this.f = null
		if (this.tryCall(f, p.near().value)) this.tryUnsubscribe()
		return promise
	}

	handle (result) {
		this.promise._resolve(result)
	}
}
