import { Future, resolve, reject } from './Promise'
import CancelToken from './CancelToken'
import Action from './Action'

// -------------------------------------------------------------
// ## Coroutine
// -------------------------------------------------------------

// coroutine :: Generator e a -> (...* -> Promise e a)
// Make a coroutine from a promise-yielding generator
export default function coroutine (generatorFunction) {
	return function coroutinified () {
		return runGenerator(generatorFunction.apply(this, arguments))
	}
}

const stack = []
Object.defineProperty(coroutine, 'cancel', {
	get () {
		if (!stack.length) throw new SyntaxError('coroutine.cancel is only available inside a coroutine')
		return stack[stack.length - 1].getToken()
	},
	set (token) {
		if (!stack.length) throw new SyntaxError('coroutine.cancel is only available inside a coroutine')
		token = CancelToken.from(token)
		stack[stack.length - 1].setToken(token)
	},
	configurable: true
})

function runGenerator (generator) {
	const swappable = CancelToken.reference(null)
	const promise = new Future(swappable.get())
	promise._whenToken(new Coroutine(generator, promise, swappable)).run()
	// taskQueue.add(new Coroutine(generator, promise, swappable))
	return promise
}

class Coroutine extends Action {
	constructor (generator, promise, ref) {
		super(promise)
		// the generator that is driven. Empty after cancellation
		this.generator = generator
		// a CancelTokenReference
		this.tokenref = ref
	}

	run () {
		this.step(this.generator.next, void 0)
	}

	fulfilled (ref) {
		if (this.generator == null) return
		this.step(this.generator.next, ref.value)
	}

	rejected (ref) {
		if (this.generator == null) return false
		this.step(this.generator.throw, ref.value)
		return true
	}

	cancel (results) {
		/* istanbul ignore else */
		if (this.promise._isResolved()) { // promise checks for cancellation itself
			const res = new Future()
			this.promise = new Coroutine(this.generator, res, null) // not cancellable
			this.generator = null
			this.tokenref = null
			if (results) results.push(res)
		}
	}

	cancelled (p) {
		const cancelRoutine = this.promise
		this.promise = null
		const reason = p.near().value
		cancelRoutine.step(cancelRoutine.generator.return, reason)
	}

	step (f, x) {
		/* eslint complexity:[2,5] */
		let result
		stack.push(this)
		try {
			result = f.call(this.generator, x)
		} catch (e) {
			result = {value: reject(e), done: true}
		} finally {
			stack.pop() // assert: === this
		}
		if (this.generator) { // not cancelled during execution
			const res = resolve(result.value, this.promise.token) // TODO optimise token?
			if (result.done) {
				this.put(res)
			} else {
				res._runAction(this)
			}
		}
	}

	setToken (t) {
		if (this.tokenref == null) throw new ReferenceError('coroutine.cancel is only available until cancellation')
		this.tokenref.set(t)
	}

	getToken () {
		if (this.tokenref == null) throw new ReferenceError('coroutine.cancel is only available until cancellation')
		return this.tokenref.get()
	}
}
