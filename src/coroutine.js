export default function (resolve, iterator, promise) {
	new Coroutine(resolve, iterator, promise).run()
	return promise
}

class Coroutine {
	constructor (resolve, iterator, promise) {
		this.resolve = resolve
		this.iterator = iterator
		this.promise = promise
	}

	run () {
		this.step(this.iterator.next, void 0)
	}

	step (continuation, x) {
		try {
			this.handle(continuation.call(this.iterator, x))
		} catch (e) {
			this.promise._reject(e)
		}
	}

	handle (result) {
		if (result.done) {
			return this.promise._resolve(result.value)
		}

		this.resolve(result.value)._runAction(this)
	}

	fulfilled (ref) {
		this.step(this.iterator.next, ref.value)
	}

	rejected (ref) {
		this.step(this.iterator.throw, ref.value)
		return true
	}
}
