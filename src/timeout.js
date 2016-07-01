import Action from './Action'
import TimeoutError from './TimeoutError'

export default function timeout (ms, p, promise) {
	const timer = setTimeout(rejectOnTimeout, ms, promise)
	p._runAction(new Timeout(timer, promise))
	return promise
}

class Timeout extends Action {
	constructor (timer, promise) {
		super(promise)
		this.timer = timer
	}

	fulfilled (p) {
		clearTimeout(this.timer)
		this.promise._become(p)
	}

	rejected (p) {
		clearTimeout(this.timer)
		return super.rejected(p)
	}
}

function rejectOnTimeout (promise) {
	promise._reject(new TimeoutError('promise timeout'))
}
