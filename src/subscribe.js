import { noop } from './util'
import { CancellableAction } from './Action'

export function subscribe (f, t, promise) {
	if (promise.token != null && promise.token.requested) {
		return promise.token.getCancelled()
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
		if (sub != null && sub.f != null && sub.f !== noop) { // noop is the "currently running" sentinel
			t._unsubscribe(sub)
			t = sub = null
			if (typeof g === 'function') {
				return g.apply(this, arguments)
			}
		}
	}
}

class Subscription extends CancellableAction {
	cancel (p) {
		/* eslint complexity:[2,4] */
		const promise = this.promise
		if (promise.token != null) {
			const res = super.cancel(p)
			if (res != null) {
				return res
			}
		}
		this.tryCall(this.f, p.near().value)
		return promise
	}
}
