import TimeoutError from './TimeoutError'

export default function (ms, p, promise) {
	const timer = setTimeout(rejectOnTimeout, ms, promise)
	p._runAction(new Timeout(timer, promise))
	return promise
}

class Timeout {
	constructor (timer, promise) {
		this.timer = timer
		this.promise = promise
	}

	fulfilled (p) {
		clearTimeout(this.timer)
		this.promise._become(p)
	}

	rejected (p) {
		clearTimeout(this.timer)
		this.promise._become(p)
		return false
	}
}

function rejectOnTimeout (promise) {
	promise._reject(new TimeoutError('promise timeout'))
}
