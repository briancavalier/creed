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
	cancel (results) {
		/* eslint complexity:[2,4] */
		const promise = this.promise
		if (promise.token != null) { // possibly called from promise.token
			if (super.cancel()) { // if promise is cancelled
				return
			}
		}
		// otherwise called from standalone token
		if (results) results.push(this.promise)
	}

	cancelled (p) {
		this.tryCall(this.f, p.near().value)
	}
}
