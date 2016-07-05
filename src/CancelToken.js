import { noop } from './util'
import { Future, resolve, reject, silentReject, never, taskQueue } from './Promise' // deferred
import { isSettled } from './inspect'

export default class CancelToken {
	// https://domenic.github.io/cancelable-promise/#sec-canceltoken-constructor
	constructor (executor) {
		if (typeof executor !== 'function') {
			throw new TypeError('must provide an executor function')
		}
		this._cancelled = false
		this.promise = void 0
		this.length = 0
		this.scanLow = 0
		this.scanHigh = 0
		if (executor !== noop) {
			executor(reason => this._cancel(reason))
		}
	}
	_cancel (reason) {
		if (this._cancelled) return
		return this.__cancel(silentReject(reason))
	}
	__cancel (p) {
		this._cancelled = true
		if (this.promise !== void 0) {
			this.promise._resolve(p)
		} else {
			this.promise = p
		}
		return this.run()
	}
	run () {
		/* eslint complexity:[2,4] */
		const result = []
		for (let i = 0; i < this.length; ++i) {
			if (this[i] && this[i].promise) { // not already destroyed
				this._runAction(this[i], result)
			}
			this[i] = void 0
		}
		this.length = 0
		return result
	}
	_runAction (action, results) {
		try {
			const res = action.cancel(this.promise)
			if (res != null) {
				if (Array.isArray(res)) {
					results.push(...res)
				} else {
					results.push(res)
				}
			}
		} catch (e) {
			results.push(reject(e))
		}
	}
	_subscribe (action) {
		if (this.requested && this.length === 0) {
			taskQueue.add(this) // asynchronous?
		}
		this[this.length++] = action
	}
	_unsubscribe (action) {
		/* eslint complexity:[2,6] */
		let i = this._cancelled ? 0 : Math.min(5, this.length)
		while (i--) {
			// an inplace-filtering algorithm to remove empty actions
			// executed at up to 5 steps per unsubscribe
			if (this.scanHigh < this.length) {
				if (this[this.scanHigh] === action) {
					this[this.scanHigh] = action = null
				} else if (this[this.scanHigh].promise == null) {
					this[this.scanHigh] = null
				} else {
					this[this.scanLow++] = this[this.scanHigh]
				}
				this.scanHigh++
			} else {
				this.length = this.scanLow
				this.scanLow = this.scanHigh = 0
			}
		}
		if (action) { // when not found
			action.destroy() // at least mark explictly as empty
		}
	}
	subscribe (fn, promise) {
		promise = promise != null ? resolve(promise) : never()
		this._subscribe({
			promise,
			cancel (p) {
				if (!isSettled(this.promise)) {
					return resolve(fn(p.near().value))
				}
			}
		})
		// TODO unsubscribe when promise settles
		return this
	}
	getRejected () {
		if (this.promise === void 0) {
			this.promise = new Future() // never cancelled :-)
		}
		return this.promise
	}
	// https://domenic.github.io/cancelable-promise/#sec-canceltoken.prototype.requested
	get requested () {
		return this._cancelled
	}
	// https://domenic.github.io/cancelable-promise/#sec-canceltoken.source
	static source () {
		if (this === CancelToken) {
			const token = new this(noop)
			return {
				token,
				cancel (r) { return token._cancel(r) }
			}
		} else {
			let cancel
			const token = new this(c => { cancel = c })
			return {token, cancel}
		}
	}
	static for (thenable) {
		return new this(cancel => resolve(thenable).then(cancel)) // finally?
	}
	static from (cancelTokenlike) {
		if (cancelTokenlike == null) return null
		/* istanbul ignore else */
		if (cancelTokenlike instanceof CancelToken) return cancelTokenlike
		else throw new TypeError('not a CancelToken') // TODO
	}
	static empty () {
		return new this(noop) // NeverCancelToken
	}
	concat (token) {
		if (this.requested) return this
		if (token.requested) return token
		return new CancelToken(cancel => {
			this.subscribe(cancel)
			token.subscribe(cancel)
		})
	}
	static pool (tokens) {
		return new CancelTokenPool(tokens)
	}
	static reference (cur) {
		return new CancelTokenReference(cur)
	}
}

class LiveCancelToken extends CancelToken {
	constructor (check) {
		super(noop)
		this.check = check
	}
	__cancel (p) {
		this.check = null
		return super.__cancel(p)
	}
	get requested () {
		return this._cancelled || this.check._testRequested()
		/* if (this._cancelled) return true
		const c = this.check._testRequested()
		if (c) {
			this.__cancel(this.check._getRejected())
		}
		return c */
	}
}

class CancelTokenPool { // implements cancel parts of Action
	constructor (tokens) {
		this.promise = new LiveCancelToken(this)
		this.tokens = []
		this.count = 0
		if (tokens) this.add(...tokens)
	}
	// never called (by unsubscribe): destroy () {}
	cancel (p) {
		// assert: !this.promise._cancelled
		if (--this.count === 0) {
			return this.promise.__cancel(this._getRejected())
		}
	}
	_testRequested () {
		return this.tokens.length > 0 && this.tokens.every(t => t.requested)
	}
	_getRejected () {
		const reasons = this.tokens.map(t => t.getRejected().near().value)
		this.tokens = null
		return silentReject(reasons)
	}
	add (...tokens) {
		if (this.tokens == null) return
		this.count += tokens.length
		// for (let t of tokens) { // https://phabricator.babeljs.io/T2164
		for (let i = 0, t; i < tokens.length && (t = tokens[i]); i++) {
			t = CancelToken.from(t)
			if (this.promise === t) {
				this.count--
				continue
			}
			this.tokens.push(t)
			if (t.requested) {
				this.count--
			} else {
				t._subscribe(this)
			}
		}
		if (this.tokens.length > 0 && this.count === 0) {
			this.promise.__cancel(this._getRejected())
		}
	}
	get () {
		return this.promise
	}
}

export class CancelTokenReference { // implements cancel parts of Action
	constructor (cur) {
		this.promise = new LiveCancelToken(this)
		this.curToken = cur
	}
	/* istanbul ignore next */
	destroy () {
		// possibly called when unsubscribed from curToken
	}
	cancel (p) {
		/* istanbul ignore if */
		if (this.curToken == null || this.curToken.getRejected() !== p) return // when called from an oldToken
		// assert: !this.promise._cancelled
		return this.promise.__cancel(p)
	}
	_testRequested () {
		return this.curToken != null && this.curToken.requested
	}
	/* _getRejected () {
		return this.curToken.getRejected()
	} */
	set (newToken) {
		/* eslint complexity:[2,7] */
		const oldToken = this.curToken
		if (oldToken && oldToken.requested) {
			throw new ReferenceError('token must not be changed after being cancelled')
		}
		if (oldToken !== newToken && this.promise !== newToken) {
			if (oldToken) {
				oldToken._unsubscribe(this)
			}
			this.curToken = newToken
			if (newToken) {
				if (newToken.requested) {
					this.promise.__cancel(newToken.getRejected())
				} else {
					newToken._subscribe(this)
				}
			}
		}
	}
	get () {
		return this.promise
	}
}
