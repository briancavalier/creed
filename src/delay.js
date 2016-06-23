import Action from './Action'

export default function delay (ms, p, promise) {
	p._runAction(new Delay(ms, promise))
	return promise
}

class Delay extends Action {
	constructor (time, promise) {
		super(promise)
		this.time = time
		this.id = null
	}

	destroy () {
		super.destroy()
		this.time = 0
		if (this.id) {
			/* global clearTimeout */
			clearTimeout(this.id)
			this.id = null
		}
	}

	fulfilled (p) {
		/* global setTimeout */
		this.id = setTimeout(become, this.time, p, this)
	}
}

function become (p, action) {
	const token = action.promise.token
	action.promise._become(p)
	if (token != null) token._unsubscribe(action)
}
