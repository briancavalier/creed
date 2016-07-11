export default function (ms, p, promise) {
	p._runAction(new Delay(ms, promise))
	return promise
}

class Delay {
	constructor (time, promise) {
		this.time = time
		this.promise = promise
	}

	fulfilled (p) {
		/*global setTimeout*/
		setTimeout(become, this.time, p, this.promise)
	}

	rejected (p) {
		this.promise._become(p)
	}
}

function become (p, promise) {
	promise._become(p)
}
