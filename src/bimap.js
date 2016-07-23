import { Map } from './map'

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
		try {
			const g = this.g
			this.promise._reject(g(p.value))
		} catch (e) {
			this.promise._reject(e)
		}
	}
}
