import { noop } from './util'
import { Future, resolve, reject, silentReject, taskQueue } from './Promise' // deferred
import { subscribe, subscribeOrCall } from './subscribe'

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
		const l = this.length
		for (let i = 0; i < l; ++i) {
			if (this[i] && this[i].promise) { // not already destroyed
				this._runAction(this[i], result)
			}
			this[i] = void 0
		}
		if (this.length === l) {
			this.length = 0
		} else {
			taskQueue.add(this)
		}
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
	subscribe (fn, token) {
		return subscribe(fn, this, new Future(token))
	}
	subscribeOrCall (fn, c) {
		return subscribeOrCall(fn, c, this, new Future())
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
		return new CancelTokenRace([this, token]).get()
	}
	static race (tokens) {
		return new CancelTokenRace(tokens)
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
	}
}

class CancelTokenCombinator { // implements cancel parts of Action
	constructor () {
		// should be named "token" but is necessary for Action-like usage
		this.promise = new LiveCancelToken(this)
	}
	/* istanbul ignore next */
	destroy () {
		// possibly called when unsubscribed from a token
	}
	// abstract cancel (p) {}
	// abstract _testRequested () {}
	get () {
		return this.promise
	}
}

class CancelTokenRace extends CancelTokenCombinator {
	constructor (tokens) {
		super()
		this.tokens = []
		if (tokens) this.add(...tokens)
	}
	cancel (p) {
		/* istanbul ignore if */
		if (this.tokens == null) return // when called after been unsubscribed but not destroyed
		// assert: !this.promise._cancelled
		// for (let t of this.tokens) { // https://phabricator.babeljs.io/T2164
		for (let i = 0, t; i < this.tokens.length && (t = this.tokens[i]); i++) {
			t._unsubscribe(this)
		}
		this.tokens = null
		return this.promise.__cancel(p)
	}
	_testRequested () {
		return this.tokens.some(t => t.requested)
	}
	add (...tokens) {
		if (this.tokens == null) return
		// for (let t of tokens) { // https://phabricator.babeljs.io/T2164
		for (let i = 0, t; i < tokens.length && (t = tokens[i]); i++) {
			t = CancelToken.from(t)
			if (t === this.promise || t == null) {
				continue
			}
			if (t.requested) {
				this.cancel(t.getRejected())
				break
			} else {
				this.tokens.push(t)
				t._subscribe(this)
			}
		}
	}
}

class CancelTokenPool extends CancelTokenCombinator {
	constructor (tokens) {
		super()
		this.tokens = []
		this.count = 0
		if (tokens) this.add(...tokens)
	}
	cancel (p) {
		// assert: !this.promise._cancelled
		this.count--
		return this._check()
	}
	_testRequested () {
		return this.tokens.length > 0 && this.tokens.every(t => t.requested)
	}
	_check () {
		if (this.count === 0) {
			const reasons = this.tokens.map(t => t.getRejected().near().value)
			this.tokens = null
			return this.promise.__cancel(silentReject(reasons))
		}
	}
	add (...tokens) {
		if (this.tokens == null) return
		this.count += tokens.length
		// for (let t of tokens) { // https://phabricator.babeljs.io/T2164
		for (let i = 0, t; i < tokens.length && (t = tokens[i]); i++) {
			t = CancelToken.from(t)
			if (t === this.promise || t == null) {
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
		if (this.tokens.length > 0) {
			this._check()
		}
	}
}

export class CancelTokenReference extends CancelTokenCombinator {
	constructor (cur) {
		super()
		this.curToken = cur
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
}
