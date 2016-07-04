import { noop } from './util'
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
		return stack[stack.length - 1].token
	},
	set (token) {
		if (!stack.length) throw new SyntaxError('coroutine.cancel is only available inside a coroutine')
		token = CancelToken.from(token)
		stack[stack.length - 1].token._follow(token)
	},
	configurable: true
})

function runGenerator (generator) {
	const promise = new Future(new SwappableCancelToken())
	new Coroutine(generator, promise).run()
	// taskQueue.add(new Coroutine(generator, promise))
	return promise
}

class Coroutine extends Action {
	constructor (generator, promise) {
		super(promise)
		// the generator that is driven. After cancellation, reference to cleanup coroutine
		this.generator = generator
		// the CancelToken that can be directed to follow the current token
		this.token = promise.token
	}

	destroy () {
		super.destroy()
		this.generator = null
		this.token = null
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
			this.promise = null
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
			const token = this.promise.token
			if (result.done) {
				this.promise._resolve(result.value)
				if (token != null) token._unsubscribe(this)
			} else {
				resolve(result.value, token)._runAction(this)
			}
		} else { // cancelled during execution
			// ignoring result.done and result.value
			// if done, one would only need to resolve the initialised promise and not call return()
			this.resumeCancel()
		}
	}

	initCancel (p) {
		// assert: p === this.promise.token.getRejected()
		const promise = new Future()
		this.generator = new Coroutine(this.generator, promise, p.value)
		return promise
	}

	resumeCancel () {
		const cancelRoutine = this.generator
		this.generator = null
		const reason = cancelRoutine.token
		cancelRoutine.token = null // not cancellable
		// assert: reason === this.token.getRejected().value
		this.token = null
		cancelRoutine.step(cancelRoutine.generator.return, reason)
	}
}

class SwappableCancelToken extends CancelToken { // also implements cancel parts of Action
	constructor () {
		super(noop)
		this.promise = new Future()
		this.curToken = null
	}

	destroy () {
		// possibly called when unsubscribed from curToken
	}

	cancel (p) {
		if (this._cancelled) return
		if (p !== this.curToken.getRejected()) return
		this._cancelled = true
		this.promise._resolve(p)
		return this.run()
	}

	get requested () {
		if (this.curToken == null) return false
		const c = this.curToken.requested
		if (c && !this._cancelled) {
			this.cancel(this.curToken.getRejected())
		}
		return c
	}

	_follow (newToken) {
		/* eslint complexity:[2,7] */
		const oldToken = this.curToken
		if (oldToken && oldToken.requested) {
			throw new ReferenceError('token must not be changed after being cancelled')
		}
		if (oldToken !== newToken && this !== newToken) {
			if (oldToken) {
				oldToken._unsubscribe(this)
			}
			this.curToken = newToken
			if (newToken) {
				if (newToken.requested) {
					this.cancel(newToken.getRejected())
				} else {
					newToken._subscribe(this)
				}
			}
		}
	}
}
