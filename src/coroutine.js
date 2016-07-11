import { resolve } from './Promise'
import Action from './Action'

export default function coroutine (iterator, promise) {
	new Coroutine(iterator, promise).start()
	// taskQueue.add(new Coroutine(iterator, promise)) // with start for run
	// resolve(undefined)._when(new Coroutine(iterator, promise))
	return promise
}

class Coroutine extends Action {
	constructor (iterator, promise) {
		super(promise)
		this.iterator = iterator
	}

	_isReused () {
		return true
	}

	start () {
		this.tryCallContext(this.iterator.next, this.iterator, void 0)
	}

	handle (result) {
		if (result.done) {
			return this.promise._resolve(result.value)
		}

		resolve(result.value)._runAction(this)
	}

	fulfilled (ref) {
		this.tryCallContext(this.iterator.next, this.iterator, ref.value)
	}

	rejected (ref) {
		this.tryCallContext(this.iterator.throw, this.iterator, ref.value)
		return true
	}
}
