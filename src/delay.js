import Action from './Action'

export default function (ms, p, promise) {
	p._runAction(new Delay(ms, promise))
	return promise
}

class Delay extends Action {
	constructor (time, promise) {
		super(promise)
		this.time = time
	}

	fulfilled (p) {
		/*global setTimeout*/
		setTimeout(become, this.time, p, this.promise)
	}
}

function become (p, promise) {
	promise._become(p)
}
