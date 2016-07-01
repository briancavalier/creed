import Action from './Action'

export default function map (f, p, promise) {
	p._when(new Map(f, promise))
	return promise
}

class Map extends Action {
	constructor (f, promise) {
		super(promise)
		this.f = f
	}

	fulfilled (p) {
		this.tryCall(this.f, p.value)
	}

	handle (result) {
		this.promise._fulfill(result)
	}
}
