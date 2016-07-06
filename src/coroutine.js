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
	new Coroutine(generator, promise, swappable).run()
	// taskQueue.add(new Coroutine(generator, promise, swappable))
	return promise
}

class Coroutine extends Action {
	constructor (generator, promise, ref) {
		super(promise)
		// the generator that is driven. After cancellation, reference to cleanup coroutine
		this.generator = generator
		// a CancelTokenReference
		this.tokenref = ref
	}

	run () {
		this.step(this.generator.next, void 0)
	}

	fulfilled (ref) {
		this.step(this.generator.next, ref.value)
	}

	rejected (ref) {
		this.step(this.generator.throw, ref.value)
		return true
	}

	cancel (p) {
		/* istanbul ignore else */
		if (this.promise._isResolved()) { // promise checks for cancellation itself
			// assert: p === this.promise.token.getRejected()
			this.promise = null
			const res = new Future()
			this.generator = new Coroutine(this.generator, res, p.near().value)
			if (stack.indexOf(this) < 0) {
				this.resumeCancel()
			}
			return res
		}
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
		if (this.promise) {
			const res = resolve(result.value, this.promise.token)
			if (result.done) {
				this.put(res)
			} else {
				res._runAction(this)
			}
		} else { // cancelled during execution
			// ignoring result.done and result.value
			// if done, one would only need to resolve the initialised promise and not call return()
			this.resumeCancel()
		}
	}

	resumeCancel () {
		const cancelRoutine = this.generator
		this.generator = null
		const reason = cancelRoutine.tokenref
		cancelRoutine.tokenref = null // not cancellable
		// assert: reason === this.tokenref.get().getRejected().value
		this.tokenref = null
		cancelRoutine.step(cancelRoutine.generator.return, reason)
	}

	setToken (t) {
		if (this.tokenref == null) throw new SyntaxError('coroutine.cancel is only available until cancellation')
		this.tokenref.set(t)
	}

	getToken () {
		if (this.tokenref == null) throw new SyntaxError('coroutine.cancel is only available until cancellation')
		return this.tokenref.get()
	}
}
