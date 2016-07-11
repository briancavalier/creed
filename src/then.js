export default function then (f, r, p, promise) {
	p._when(new Then(f, r, promise))
	return promise
}

class Then {
	constructor (f, r, promise) {
		this.f = f
		this.r = r
		this.promise = promise
	}

	fulfilled (p) {
		runThen(this.f, p, this.promise)
	}

	rejected (p) {
		return runThen(this.r, p, this.promise)
	}
}

function runThen (f, p, promise) {
	if (typeof f !== 'function') {
		promise._become(p)
		return false
	}

	tryMapNext(f, p.value, promise)
	return true
}

function tryMapNext (f, x, promise) {
	try {
		promise._resolve(f(x))
	} catch (e) {
		promise._reject(e)
	}
}
