import Action from './Action'
import { swapContext } from './trace'

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
			this.handleReject(e)
			return
		} finally {
			swapContext(context)
		}// else

		this.handleResult(result)
	}

	handleResult (result) {
		if (result.done) {
			return this.promise._resolve(result.value)
		}

		this.resolve(result.value)._when(this)
	}

	handleReject (e) {
		this.promise._reject(e)
	}

	fulfilled (p) {
		this.tryStep(this.generator.next, p.value)
	}

	rejected (p) {
		this.tryStep(this.generator.throw, p.value)
		return true
	}
}
