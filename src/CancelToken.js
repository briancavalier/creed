import { resolve } from './Promise'

export default class CancelToken {
	// https://domenic.github.io/cancelable-promise/#sec-canceltoken-constructor
	constructor (executor) {
		if (typeof executor !== 'function') {
			throw new TypeError('must provide an executor function')
		}
		this._cancelled = false
		executor(reason => this._cancel(reason))
	}
	_cancel (reason) {
		if (this._cancelled) return
		this._cancelled = true
	}
	// https://domenic.github.io/cancelable-promise/#sec-canceltoken.prototype.requested
	get requested () {
		return this._cancelled
	}
	// https://domenic.github.io/cancelable-promise/#sec-canceltoken.source
	static source () {
		// optimise case if (this === CancelToken)
		let cancel
		const token = new this(c => { cancel = c })
		return {token, cancel}
	}
	static for (thenable) {
		return new this(cancel => resolve(thenable).then(cancel)) // finally?
	}
	static from (cancelTokenlike) {
	}
}
