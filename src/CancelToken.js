import { noop } from './util'
import { Future, resolve, reject, silenceError, taskQueue } from './Promise' // deferred
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
		this._cancelled = true
		const p = reject(reason) // tag as intentionally rejected, p._state |= CANCELLED?
		silenceError(p)
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
			try {
				if (this[i] && this[i].promise) { // not already destroyed
					result.push(resolve(this[i].cancel(this.promise)))
				}
			} catch (e) {
				result.push(reject(e))
			}
			this[i] = void 0
		}
		this.length = 0
		return result
	}
	_subcribe (action) {
		if (this.requested && this.length === 0) {
			taskQueue.add(this) // asynchronous?
		}
		this[this.length++] = action
	}
	_unsubscribe (action) {
		for (let i=Math.min(5, this.length); i--; ) {
			// an inplace-filtering algorithm to remove empty actions
			// executed at up to 5 steps per unsubscribe
			if (this.scanHigh < this.length) {
				if (this[this.scanHigh] === action) {
					this[this.scanHigh] = action = null;
				} else if (this[this.scanHigh].promise == null) {
					this[this.scanHigh] = null;
				} else {
					this[this.scanLow++] = this[this.scanHigh]
				}
				this.scanHigh++
			} else {
				this.length = this.scanLow;
				this.scanLow = this.scanHigh = 0;
			}
		}
		if (action) { // when not found
			action._destroy() // at least mark explictly as empty
		}
	}
	subscribe (fn, promise) {
		promise = resolve(promise)
		this._subscribe({
			promise,
			cancel (p) {
				if (!isSettled(this.promise)) {
					return fn(p.value)
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
				cancel (r) { token._cancel(r) }
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
		if (cancelTokenlike instanceof CancelToken) {
			return cancelTokenlike
		}
	}
	static empty () {
		return new this(noop) // NeverCancelToken
	}
	concat (token) {
		return new CancelToken(cancel => {
			this.subscribe(cancel)
			token.subscribe(cancel)
		})
	}
}

class CancelTokenPool {
	constructor (tokens) {
		this.token = new CancelToken(noop)
		this.reasons = []
		this.count = 0
		this.check = r => {
			this.reasons.push(r)
			if (--this.count === 0) {
				this.token._cancel(this.reasons) // forward return value ???
				this.reasons = null
			}
		}
		if (tokens) this.add(...tokens)
		// if (this.count === 0 && !this.token.requested) this.token._cancel() ???
	}
	add (...tokens) {
		if (this.token.requested) return
		this.count += tokens.length
		for (let t of tokens) CancelToken.from(t).subscribe(this.check)
	}
	get () {
		return this.token
	}
}
