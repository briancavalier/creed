import { describe, it } from 'mocha'
import { isFulfilled, isRejected, isSettled, isPending, isHandled, isNever, silenceError, getValue, getReason } from '../src/inspect'
import { resolve, reject, fulfill, never, Future } from '../src/Promise'
import assert from 'assert'

describe('inspect', () => {
	describe('isFulfilled', () => {
		it('should be true for fulfilled promise', () => {
			assert(isFulfilled(resolve()))
		})

		it('should be false for rejected promise', () => {
			assert(!isFulfilled(reject()))
		})

		it('should be false for pending promise', () => {
			assert(!isFulfilled(new Future()))
		})

		it('should be false for never', () => {
			assert(!isFulfilled(never()))
		})
	})

	describe('isRejected', () => {
		it('should be true for rejected promise', () => {
			assert(isRejected(reject()))
		})

		it('should be false for fulfilled promise', () => {
			assert(!isRejected(resolve()))
		})

		it('should be false for pending promise', () => {
			assert(!isRejected(new Future()))
		})

		it('should be false for never', () => {
			assert(!isRejected(never()))
		})
	})

	describe('isSettled', () => {
		it('should be true for fulfilled promise', () => {
			assert(isSettled(resolve()))
		})

		it('should be true for rejected promise', () => {
			assert(isSettled(reject()))
		})

		it('should be false for pending promise', () => {
			assert(!isSettled(new Future()))
		})

		it('should be false for never', () => {
			assert(!isSettled(never()))
		})
	})

	describe('isPending', () => {
		it('should be false for fulfilled promise', () => {
			assert(!isPending(resolve()))
		})

		it('should be false for rejected promise', () => {
			assert(!isPending(reject()))
		})

		it('should be true for pending promise', () => {
			assert(isPending(new Future()))
		})

		it('should be true for never', () => {
			assert(isPending(never()))
		})
	})

	describe('isNever', () => {
		it('should be false for fulfilled promise', () => {
			assert(!isNever(resolve()))
		})

		it('should be false for rejected promise', () => {
			assert(!isNever(reject()))
		})

		it('should be false for pending promise', () => {
			assert(!isNever(new Future()))
		})

		it('should be true for never', () => {
			assert(isNever(never()))
		})
	})

	describe('isHandled', () => {
		it('should be false for fulfilled promise', () => {
			assert(!isHandled(resolve()))
		})

		it('should be false for rejected promise', () => {
			assert(!isHandled(reject()))
		})

		it('should be true for handled rejected promise', done => {
			const p = reject()
			p.catch(() => {})
				.then(() => {
					assert(isHandled(p))
					done()
				})
		})

		it('should be true for silenced rejected promise', () => {
			const p = reject()
			silenceError(p)
			assert(isHandled(p))
		})

		it('should be false for pending promise', () => {
			assert(!isHandled(new Future()))
		})

		it('should be false for never', () => {
			assert(!isHandled(never()))
		})
	})

	describe('getValue', () => {
		it('should get value from fulfilled promise', () => {
			const x = {}
			assert.strictEqual(x, getValue(resolve(x)))
		})

		it('should throw for rejected promise', () => {
			assert.throws(() => getValue(reject()))
		})

		it('should throw for pending promise', () => {
			assert.throws(() => getValue(new Future()))
		})

		it('should throw for never', () => {
			assert.throws(() => getValue(never()))
		})
	})

	describe('getReason', () => {
		it('should handle rejected promise', () => {
			const p = reject()
			assert(!isHandled(p))

			getReason(p)
			assert(isHandled(p))
		})

		it('should get reason from rejected promise', () => {
			let x = {}
			assert.strictEqual(x, getReason(reject(x)))
		})

		it('should throw for fulfilled promise', () => {
			assert.throws(() => getReason(fulfill()))
		})

		it('should throw for pending promise', () => {
			assert.throws(() => getReason(new Future()))
		})

		it('should throw for never', () => {
			assert.throws(() => getReason(never()))
		})
	})

	describe('silenceError', () => {
		it('should handle rejected promise', () => {
			const p = reject()
			assert(!isHandled(p))

			silenceError(p)
			assert(isHandled(p))
		})

		it('should be a noop for fulfilled promise', () => {
			const p = resolve()
			assert(!isHandled(p))

			silenceError(p)
			assert(!isHandled(p))
		})
	})
})
