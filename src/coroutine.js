import Action from './Action'

export default function (resolve, iterator, promise) {
	new Coroutine(resolve, iterator, promise).run()
	return promise
}

class Coroutine extends Action {
	constructor (resolve, iterator, promise) {
		super(promise)
		this.resolve = resolve
		this.generator = iterator
	}

	run () {
		this.tryStep(this.generator.next, void 0)
	}

	tryStep (resume, x) {
		let result
		// test if `resume` (and only it) throws
		try {
			result = resume.call(this.generator, x)
		} catch (e) {
			this.promise._reject(e)
			return
		} // else
		this.handle(result)
	}

	handle (result) {
		if (result.done) {
			return this.promise._resolve(result.value)
		}

		this.resolve(result.value)._runAction(this)
	}

	fulfilled (ref) {
		this.tryStep(this.generator.next, ref.value)
	}

	rejected (ref) {
		this.tryStep(this.generator.throw, ref.value)
		return true
	}
}
