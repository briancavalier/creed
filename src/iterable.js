import { isFulfilled, isRejected, silenceError } from './inspect'
import maybeThenable from './maybeThenable'

export function resultsArray (iterable) {
	return Array.isArray(iterable) ? new Array(iterable.length) : []
}

export function resolveIterable (resolve, handler, promises, promise) {
	const run = Array.isArray(promises) ? runArray : runIterable
	try {
		run(resolve, handler, promises, promise)
	} catch (e) {
		promise._reject(e)
	}
	return promise.near()
}

function runArray (resolve, handler, promises, promise) {
	let i = 0

	for (; i < promises.length; ++i) {
		handleItem(resolve, handler, promises[i], i, promise)
	}

	handler.complete(i, promise)
}

function runIterable (resolve, handler, promises, promise) {
	let i = 0
	const iter = promises[Symbol.iterator]()

	while (true) {
		const step = iter.next()
		if (step.done) {
			break
		}
		handleItem(resolve, handler, step.value, i++, promise)
	}

	handler.complete(i, promise)
}

function handleItem (resolve, handler, x, i, promise) {
	/*eslint complexity:[1,6]*/
	if (!maybeThenable(x)) {
		handler.valueAt(x, i, promise)
		return
	}

	const p = resolve(x)

	if (promise._isResolved()) {
		if (!isFulfilled(p)) {
			silenceError(p)
		}
	} else if (isFulfilled(p)) {
		handler.fulfillAt(p, i, promise)
	} else if (isRejected(p)) {
		handler.rejectAt(p, i, promise)
	} else {
		settleAt(p, handler, i, promise)
	}
}

function settleAt (p, handler, i, promise) {
	p._runAction({handler, i, promise, fulfilled, rejected})
}

function fulfilled (p) {
	this.handler.fulfillAt(p, this.i, this.promise)
}

function rejected (p) {
	return this.handler.rejectAt(p, this.i, this.promise)
}
