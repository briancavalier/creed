import { isObject } from './util'
import { Future, reject, resolveObject, silenceError } from './Promise' // deferred
import { isFulfilled, isRejected } from './inspect'
import Action from './Action'

function isIterable (x) {
	return typeof x === 'object' && x !== null
}

export function iterablePromise (handler, iterable) {
	if (!isIterable(iterable)) {
		return reject(new TypeError('expected an iterable'))
	}

	const p = new Future()
	return resolveIterable(handler, iterable, p)
}

export function resultsArray (iterable) {
	return Array.isArray(iterable) ? new Array(iterable.length) : []
}

export function resolveIterable (handler, promises, promise) {
	const run = Array.isArray(promises) ? runArray : runIterable
	try {
		run(handler, promises, promise)
	} catch (e) {
		promise._reject(e)
	}
	return promise.near()
}

function runArray (handler, promises, promise) {
	let i = 0

	for (; i < promises.length; ++i) {
		handleItem(handler, promises[i], i, promise)
	}

	handler.complete(i, promise)
}

function runIterable (handler, promises, promise) {
	let i = 0
	const iter = promises[Symbol.iterator]()

	while (true) {
		const step = iter.next()
		if (step.done) {
			break
		}
		handleItem(handler, step.value, i++, promise)
	}

	handler.complete(i, promise)
}

function handleItem (handler, x, i, promise) {
	/*eslint complexity:[1,6]*/
	if (!isObject(x)) {
		handler.valueAt(x, i, promise)
		return
	}

	const p = resolveObject(x)

	if (promise._isResolved()) {
		if (!isFulfilled(p)) {
			silenceError(p)
		}
	} else if (isFulfilled(p)) {
		handler.fulfillAt(p, i, promise)
	} else if (isRejected(p)) {
		handler.rejectAt(p, i, promise)
	} else {
		p._runAction(new Indexed(handler, i, promise))
	}
}

class Indexed extends Action {
	constructor (handler, i, promise) {
		super(promise)
		this.i = i
		this.handler = handler
	}

	fulfilled (p) {
		this.handler.fulfillAt(p, this.i, this.promise)
	}

	rejected (p) {
		return this.handler.rejectAt(p, this.i, this.promise)
	}
}
