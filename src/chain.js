import Action from './Action'
import tryCall from './tryCall'
import maybeThenable from './maybeThenable'

export default function (f, p, promise) {
	p._when(new Chain(f, promise))
	return promise
}

class Chain extends Action {
	constructor (f, promise) {
		super(promise)
		this.f = f
	}

	fulfilled (p) {
		tryCall(this.f, p.value, handleChain, this.promise)
	}
}

function handleChain (promise, result) {
	if (!(maybeThenable(result) && typeof result.then === 'function')) {
		promise._reject(new TypeError('f must return a promise'))
	}

	promise._resolve(result)
}
