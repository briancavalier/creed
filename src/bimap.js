import { Map } from './map'
import tryCall from './tryCall'

export default function (f, g, p, promise) {
	p._when(new Bimap(f, g, promise))
	return promise
}

class Bimap extends Map {
	constructor (f, g, promise) {
		super(f, promise)
		this.g = g
	}

	rejected (p) {
		tryCall(this.g, p.value, handleMapRejected, this.promise)
	}
}

function handleMapRejected (promise, result) {
	promise._reject(result)
}
