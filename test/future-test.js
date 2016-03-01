import { describe, it } from 'mocha'
import { future, reject, fulfill, never, Future } from '../src/Promise'
import { silenceError } from '../src/inspect'
import { assertSame } from './lib/test-util'
import assert from 'assert'

const f = x => x + 1
const fp = x => fulfill(x + 1)

describe('future', () => {
	it('should return { resolve, promise }', () => {
		const { resolve, promise } = future()
		assert(typeof resolve === 'function')
		assert(promise instanceof Future)
	})

	describe('then', () => {
		it('should add handlers', () => {
			const { resolve, promise } = future()
			assertSame(promise.then(f), promise.then(fp))
			setTimeout(resolve, 0, 1)
			return promise
		})
	})

	describe('resolve', () => {
		it('should fulfill promise with value', () => {
			const { resolve, promise } = future()
			const expected = {}
			resolve(expected)
			return promise.then(x => assert.strictEqual(expected, x))
		})

		it('should resolve to fulfilled promise', () => {
			const { resolve, promise } = future()
			const expected = {}
			resolve(fulfill(expected))
			return promise.then(x => assert.strictEqual(expected, x))
		})

		it('should resolve to rejected promise', () => {
			const { resolve, promise } = future()
			const expected = {}
			resolve(reject(expected))
			return promise.then(assert.ifError, x => assert.strictEqual(expected, x))
		})
	})

	describe('when resolved to another promise', () => {
		describe('state', () => {
			it('should have fulfilled state', () => {
				const { resolve, promise } = future()

				const p = fulfill(1)
				resolve(p)
				assert.equal(p.state(), promise.state())
			})

			it('should have rejected state', () => {
				const { resolve, promise } = future()

				const p = reject(1)
				silenceError(p)
				resolve(p)
				assert.equal(p.state(), promise.state())
			})

			it('should have never state', () => {
				const { resolve, promise } = future()

				const p = never()
				resolve(p)
				assert.equal(p.state(), promise.state())
			})
		})

		describe('inspect', () => {
			it('should have fulfilled state', () => {
				const { resolve, promise } = future()

				const p = fulfill(1)
				resolve(p)
				assert.equal(p.inspect(), promise.inspect())
			})

			it('should have rejected state', () => {
				const { resolve, promise } = future()

				const p = reject(1)
				silenceError(p)
				resolve(p)
				assert.equal(p.inspect(), promise.inspect())
			})

			it('should have never state', () => {
				const { resolve, promise } = future()

				const p = never()
				resolve(p)
				assert.equal(p.inspect(), promise.inspect())
			})
		})

		describe('catch', () => {
			it('should behave like fulfilled', () => {
				const { resolve, promise } = future()

				const p = fulfill(1)
				resolve(p)
				assert.strictEqual(p, promise.catch(f))
			})

			it('should have rejected state', () => {
				const { resolve, promise } = future()

				const p = reject(1)
				resolve(p)
				return assertSame(p.catch(f), promise.catch(f))
			})

			it('should have never state', () => {
				const { resolve, promise } = future()

				const p = never()
				resolve(p)
				assert.strictEqual(p, promise.catch(f))
			})
		})

		describe('map', () => {
			it('should behave like fulfilled', () => {
				const { resolve, promise } = future()

				const p = fulfill(1)
				resolve(p)
				return assertSame(p.map(f), promise.map(f))
			})

			it('should have rejected state', () => {
				const { resolve, promise } = future()

				const p = reject(1)
				silenceError(p)
				resolve(p)
				assert.strictEqual(p, promise.map(f))
			})

			it('should have never state', () => {
				const { resolve, promise } = future()

				const p = never()
				resolve(p)
				assert.strictEqual(p, promise.map(f))
			})
		})

		describe('chain', () => {
			it('should behave like fulfilled', () => {
				const { resolve, promise } = future()

				const p = fulfill(1)
				resolve(p)
				return assertSame(p.chain(fp), promise.chain(fp))
			})

			it('should have rejected state', () => {
				const { resolve, promise } = future()

				const p = reject(1)
				silenceError(p)
				resolve(p)
				assert.strictEqual(p, promise.chain(fp))
			})

			it('should have never state', () => {
				const { resolve, promise } = future()

				const p = never()
				resolve(p)
				assert.strictEqual(p, promise.chain(fp))
			})
		})

		describe('ap', () => {
			it('should behave like fulfilled', () => {
				const { resolve, promise } = future()

				const p = fulfill(f)
				const q = fulfill(1)
				resolve(p)
				return assertSame(p.ap(q), promise.ap(q))
			})

			it('should behave like rejected', () => {
				const { resolve, promise } = future()

				const p = reject(f)
				silenceError(p)
				resolve(p)
				assert.strictEqual(p, promise.ap(fulfill(1)))
			})

			it('should behave like never', () => {
				const { resolve, promise } = future()

				const p = never()
				resolve(p)
				return assert.strictEqual(p, promise.ap(fulfill(1)))
			})
		})

		describe('concat', () => {
			it('should behave like fulfilled', () => {
				const { resolve, promise } = future()

				const p1 = fulfill(1)
				const p2 = fulfill(2)

				resolve(p1)
				return assertSame(p1.concat(p2), promise.concat(p2))
			})

			it('should behave like rejected', () => {
				const { resolve, promise } = future()

				const p1 = reject(new Error())
				const p2 = reject(new Error())
				silenceError(p1)
				silenceError(p2)

				resolve(p1)
				assert.strictEqual(p1.concat(p2), promise.concat(p2))
			})

			it('should behave like never', () => {
				const { resolve, promise } = future()

				const p1 = never()
				const p2 = fulfill(2)

				resolve(p1)
				return assertSame(p1.concat(p2), promise.concat(p2))
			})
		})
	})
})
