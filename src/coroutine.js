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
		return stack[stack.length - 1].curToken
	},
	set (token) {
		if (!stack.length) throw new SyntaxError('coroutine.cancel is only available inside a coroutine')
		token = CancelToken.from(token)
		stack[stack.length - 1].setToken(token)
	},
	configurable: true
})

function runGenerator (generator) {
	const promise = new Future()
	new Coroutine(generator, promise).run()
	// taskQueue.add(new Coroutine(generator, promise))
	return promise
}

class Coroutine extends Action {
	constructor (generator, promise) {
		super(promise)
		// the generator that is driven. After cancellation, reference to cleanup coroutine
		this.generator = generator
		// the CancelToken (or null) currently associated with this.promise
		this.curToken = null
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
		super.cancel(p)
		/* istanbul ignore else */
		if (!this.promise) { // action got destroyed
			const res = this.initCancel(p)
			if (stack.indexOf(this) < 0) {
				this.resumeCancel()
			}
			return res
		}
	}

	step (f, x) {
		/* eslint complexity:[2,4] */
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
			if (result.done) {
				this.promise._resolve(result.value)
			} else {
				resolve(result.value)._runAction(this)
			}
		} else { // cancelled during execution
			// ignoring result.done and result.value
			// if done, one would only need to resolve the initialised promise and not call return()
			this.resumeCancel()
		}
	}

	initCancel (p) {
		// assert: p === this.curToken.getRejected()
		const promise = new Future()
		const cancelRoutine = new Coroutine(this.generator, promise)
		cancelRoutine.curToken = p.value
		this.generator = cancelRoutine
		return promise
	}

	resumeCancel () {
		const cancelRoutine = this.generator
		this.generator = null
		const reason = cancelRoutine.curToken
		cancelRoutine.curToken = null
		// assert: reason === this.curToken.getRejected().value
		this.curToken = null
		cancelRoutine.step(cancelRoutine.generator.return, reason)
	}

	setToken (newToken) {
		/* eslint complexity:[2,6] */
		const oldToken = this.curToken
		if (oldToken && oldToken.requested) {
			throw new ReferenceError('coroutine.cancel must not be changed after being cancelled')
		}
		if (oldToken !== newToken) {
			const p = this.promise
			if (oldToken) {
				oldToken._unsubscribe(this) // BUG: unsubscribing can destroy the action
				this.promise = p // we don't want that and restore it - cancel() might still be called
				//                  but that doesn't have an effect when newToken isn't cancelled
			}
			this.curToken = p.token = newToken
			if (newToken) {
				if (newToken.requested) {
					const r = newToken.getRejected()
					super.cancel(r)
					this.initCancel(r)
				} else {
					newToken._subscribe(this)
				}
			}
		}
	}
}
