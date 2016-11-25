import Action from './Action'
import tryCall from './tryCall'

export default function (f, p, promise) {
	p._when(new Map(f, promise))
	return promise
}

export class Map extends Action {
	constructor (f, promise) {
		super(promise)
		this.f = f
	}

	fulfilled (p) {
		tryCall(this.f, p.value, handleMap, this.promise)
	}
}

function handleMap (promise, result) {
	promise._fulfill(result)
}

