import Action from './Action'
import { pushContext, swapContext } from './trace'

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
		const context = swapContext(this.context)
		let result
		// test if `resume` (and only it) throws
		try {
			result = resume.call(this.generator, x)
		} catch (e) {
			this.handleReject(context, e)
			return
		} // else

		this.handleResult(context, result)
	}

	handleResult (context, result) {
		if (result.done) {
			swapContext(context)
			return this.promise._resolve(result.value)
		}

		this.context = pushContext(this.constructor)
		this.resolve(result.value)._when(this)
	}

	handleReject (context, e) {
		swapContext(context)
		this.promise._reject(e)
	}

	fulfilled (ref) {
		this.tryStep(this.generator.next, ref.value)
	}

	rejected (ref) {
		this.tryStep(this.generator.throw, ref.value)
		return true
	}
}
