import { CancellableAction } from './Action'

export default function map (f, p, promise) {
	if (promise.token != null && promise.token.requested) {
		return promise.token.getCancelled()
	}
	p._when(promise._whenToken(new Map(f, promise)))
	return promise
}

class Map extends CancellableAction {
	handle (result) {
		this.promise._fulfill(result)
	}
}
