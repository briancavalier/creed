import { taskQueue } from './Promise' // deferred
import { iterablePromise, resultsArray } from './iterable'
import Race from './Race'
import Any from './Any'
import Merge from './Merge'
import Settle from './Settle'

// -------------------------------------------------------------
// ## Iterables
// -------------------------------------------------------------

// all :: Iterable (Promise e a) -> Promise e [a]
export function all (promises) {
	const handler = new Merge(allHandler, resultsArray(promises))
	return iterablePromise(handler, promises)
}

const allHandler = {
	merge (promise, args) {
		promise._fulfill(args)
	}
}

// race :: Iterable (Promise e a) -> Promise e a
export function race (promises) {
	return iterablePromise(new Race(), promises)
}

// any :: Iterable (Promise e a) -> Promise e a
export function any (promises) {
	return iterablePromise(new Any(), promises)
}

// settle :: Iterable (Promise e a) -> Promise e [Promise e a]
export function settle (promises) {
	const handler = new Settle(resultsArray(promises))
	return iterablePromise(handler, promises)
}

// -------------------------------------------------------------
// ## Lifting
// -------------------------------------------------------------

// merge :: (...* -> b) -> ...Promise e a -> Promise e b
export function merge (f, ...args) {
	return runMerge(f, this, args)
}

function runMerge (f, thisArg, args) {
	const handler = new Merge(new MergeHandler(f, thisArg), resultsArray(args))
	return iterablePromise(handler, args)
}

class MergeHandler {
	constructor (f, c) {
		this.f = f
		this.c = c
		this.promise = void 0
		this.args = void 0
	}

	merge (promise, args) {
		this.promise = promise
		this.args = args
		taskQueue.add(this)
	}

	run () {
		try {
			// assert: this.promise.token == null
			this.promise._resolve(this.f.apply(this.c, this.args))
		} catch (e) {
			this.promise._reject(e)
		}
	}
}
