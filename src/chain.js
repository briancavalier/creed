import maybeThenable from './maybeThenable'

export default function (f, p, promise) {
	p._when(new Chain(f, promise))
	return promise
}

class Chain {
	constructor (f, promise) {
		this.f = f
		this.promise = promise
	}

	fulfilled (p) {
		try {
			runChain(this.f, p.value, this.promise)
		} catch (e) {
			this.promise._reject(e)
		}
	}

	rejected (p) {
		this.promise._become(p)
	}
}

function runChain (f, x, p) {
	const y = f(x)
	if (!(maybeThenable(y) && typeof y.then === 'function')) {
		throw new TypeError('f must return a promise')
	}

	p._resolve(y)
}
