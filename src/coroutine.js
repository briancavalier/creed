import Action from './Action'

export default function (resolve, iterator, promise) {
	new Coroutine(resolve, iterator, promise).run()
	// taskQueue.add(new Coroutine(resolve, iterator, promise))
	return promise
}

class Coroutine extends Action {
	constructor (resolve, iterator, promise) {
		super(promise)
		this.resolve = resolve
		this.next = iterator.next.bind(iterator)
		this.throw = iterator.throw.bind(iterator)
	}

	run () {
		this.tryCall(this.next, void 0)
	}

	handle (result) {
		if (result.done) {
			return this.promise._resolve(result.value)
		}

		this.resolve(result.value)._runAction(this)
	}

	fulfilled (ref) {
		this.tryCall(this.next, ref.value)
	}

	rejected (ref) {
		this.tryCall(this.throw, ref.value)
		return true
	}
}
