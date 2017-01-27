import { describe, it } from 'mocha'
import { future, reject, fulfill, isSettled, isPending, never } from '../src/main'
import { Future } from '../src/Promise'
import { silenceError } from '../src/inspect'
import { assertSame } from './lib/test-util'
import { eq, is, assert, fail } from '@briancavalier/assert'

const silenced = p => (silenceError(p), p)
const f = x => x + 1
const fp = x => fulfill(x + 1)
const rp = x => silenced(reject(x))

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
			return promise.then(is(expected))
		})

		it('should resolve to fulfilled promise', () => {
			const { resolve, promise } = future()
			const expected = {}
			resolve(fulfill(expected))
      return promise.then(is(expected))
		})

		it('should resolve to rejected promise', () => {
			const { resolve, promise } = future()
			const expected = {}
			resolve(reject(expected))
			return promise.then(fail, is(expected))
		})
	})

	describe('when resolved to another promise', () => {
		describe('state', () => {
			it('should have fulfilled state', () => {
				const { resolve, promise } = future()
				const p = fulfill(1)
				resolve(p)
				eq(p.state(), promise.state())
			})

			it('should have rejected state', () => {
				const { resolve, promise } = future()
				const p = silenced(reject(1))
				resolve(p)
				eq(p.state(), promise.state())
			})

			it('should have never state', () => {
				const { resolve, promise } = future()
				const p = never()
				resolve(p)
				eq(p.state(), promise.state())
			})
		})

		describe('inspect', () => {
			it('should have fulfilled state', () => {
				const { resolve, promise } = future()
				const p = fulfill(1)
				resolve(p)
				eq(p.inspect(), promise.inspect())
			})

			it('should have rejected state', () => {
				const { resolve, promise } = future()
				const p = silenced(reject(1))
				resolve(p)
				eq(p.inspect(), promise.inspect())
			})

			it('should have never state', () => {
				const { resolve, promise } = future()
				const p = never()
				resolve(p)
				eq(p.inspect(), promise.inspect())
			})
		})

		describe('then', () => {
			it('should behave like mapped for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(1)
				resolve(p)
				return assertSame(p.map(f), promise.then(f))
			})

			it('should behave like chained for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(1)
				resolve(p)
				return assertSame(p.chain(fp), promise.then(fp))
			})

			it('should behave like rejection chained for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(1)
				resolve(p)
				return assertSame(p.chain(rp), promise.then(rp))
			})

			it('should be identity for reject', () => {
				const { resolve, promise } = future()
				const p = silenced(reject(1))
				resolve(p)
				is(p, promise.then(f))
			})

			it('should be identity for never', () => {
				const { resolve, promise } = future()
				const p = never()
				resolve(p)
				is(p, promise.then(f))
			})
		})

		describe('catch', () => {
			it('should be identity for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(1)
				resolve(p)
				is(p, promise.catch(f))
			})

			it('should behave like mapped for reject', () => {
				const { resolve, promise } = future()
				const p = reject(1)
				resolve(p)
				return assertSame(p.catch(f), promise.catch(f))
			})

			it('should behave like chained for reject', () => {
				const { resolve, promise } = future()
				const p = reject(1)
				resolve(p)
				return assertSame(p.catch(fp), promise.catch(fp))
			})

			it('should behave like rejection chained for reject', () => {
				const { resolve, promise } = future()
				const p = reject(1)
				resolve(p)
				return assertSame(p.catch(rp), promise.catch(rp))
			})

			it('should be identity for never', () => {
				const { resolve, promise } = future()
				const p = never()
				resolve(p)
				is(p, promise.catch(f))
			})
		})

		describe('map', () => {
			it('should behave like mapped for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(1)
				resolve(p)
				return assertSame(p.map(f), promise.map(f))
			})

			it('should be identity for reject', () => {
				const { resolve, promise } = future()
				const p = silenced(reject(1))
				resolve(p)
				is(p, promise.map(f))
			})

			it('should be identity for never', () => {
				const { resolve, promise } = future()
				const p = never()
				resolve(p)
				is(p, promise.map(f))
			})
		})

		describe('chain', () => {
			it('should behave like chained for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(1)
				resolve(p)
				return assertSame(p.chain(fp), promise.chain(fp))
			})

			it('should behave like rejection chained for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(1)
				resolve(p)
				return assertSame(p.chain(rp), promise.chain(rp))
			})

			it('should be identity for reject', () => {
				const { resolve, promise } = future()
				const p = silenced(reject(1))
				resolve(p)
				is(p, promise.chain(fp))
			})

			it('should be identity for never', () => {
				const { resolve, promise } = future()
				const p = never()
				resolve(p)
				is(p, promise.chain(fp))
			})
		})

		describe('ap', () => {
			it('should behave like apply for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(f)
				const q = fulfill(1)
				resolve(p)
				return assertSame(p.ap(q), promise.ap(q))
			})

			it('should be identity for reject', () => {
				const { resolve, promise } = future()
				const p = silenced(reject(f))
				resolve(p)
				is(p, promise.ap(fulfill(1)))
			})

			it('should be identity for never', () => {
				const { resolve, promise } = future()
				const p = never()
				resolve(p)
				is(p, promise.ap(fulfill(1)))
			})
		})

		describe('concat', () => {
			it('should be identity for fulfill', () => {
				const { resolve, promise } = future()
				const p1 = fulfill(1)
				const p2 = fulfill(2)
				resolve(p1)
				is(p1, promise.concat(p2))
			})

			it('should be identity for reject', () => {
				const { resolve, promise } = future()
				const p1 = silenced(reject(new Error()))
				const p2 = silenced(reject(new Error()))
				resolve(p1)
				is(p1, promise.concat(p2))
			})

			it('should return other for never', () => {
				const { resolve, promise } = future()
				const p1 = never()
				const p2 = fulfill(2)
				resolve(p1)
				is(p1.concat(p2), promise.concat(p2))
			})
		})
	})

	describe('before being resolved to another promise', () => {
		describe('state', () => {
			it('should be pending', () => {
				const { promise } = future()
				assert(isPending(promise))
			})

			it('should not be settled', () => {
				const { promise } = future()
				assert(!isSettled(promise))
			})
		})

		describe('inspect', () => {
			it('should not be fulfilled', () => {
				const { promise } = future()
				assert(fulfill().inspect() !== promise.inspect())
			})

			it('should not be rejected', () => {
				const { promise } = future()
				assert(silenced(reject()).inspect() !== promise.inspect())
			})
		})

		describe('then', () => {
			it('should behave like mapped for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.then(f)
				resolve(p)
				return assertSame(p.map(f), res)
			})

			it('should behave like chained for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.then(fp)
				resolve(p)
				return assertSame(p.chain(fp), res)
			})

			it('should behave like rejection chained for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.then(rp)
				resolve(p)
				return assertSame(p.chain(rp), res)
			})

			it('should behave like rejected for reject', () => {
				const { resolve, promise } = future()
				const p = silenced(reject(1))
				const res = promise.then(f)
				resolve(p)
				return assertSame(p, res)
			})

			/* it('should have never state for never (#30)', () => {
				const { resolve, promise } = future()
				const p = never()
				const res = promise.then(f)
				resolve(p)
				assert(isNever(res))
			}) */
		})

		describe('catch', () => {
			it('should behave like fulfilled for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.catch(f)
				resolve(p)
				return assertSame(p, res)
			})

			it('should behave like mapped for reject', () => {
				const { resolve, promise } = future()
				const p = reject(1)
				const res = promise.catch(f)
				resolve(p)
				return assertSame(p.catch(f), res)
			})

			it('should behave like chained for reject', () => {
				const { resolve, promise } = future()
				const p = reject(1)
				const res = promise.catch(fp)
				resolve(p)
				return assertSame(p.catch(fp), res)
			})

			it('should behave like rejection chained for reject', () => {
				const { resolve, promise } = future()
				const p = reject(1)
				const res = promise.catch(rp)
				resolve(p)
				return assertSame(p.catch(rp), res)
			})

			/* it('should have never state for never (#30)', () => {
				const { resolve, promise } = future()
				const p = never()
				const res = promise.catch(f)
				resolve(p)
				assert(isNever(res))
			}) */
		})

		describe('map', () => {
			it('should behave like mapped for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.map(f)
				resolve(p)
				return assertSame(p.map(f), res)
			})

			it('should behave like rejection for reject', () => {
				const { resolve, promise } = future()
				const p = silenced(reject(1))
				const res = promise.map(f)
				resolve(p)
				return assertSame(p, res)
			})

			/* it('should have never state for never (#30)', () => {
				const { resolve, promise } = future()
				const p = never()
				const res = promise.map(f)
				resolve(p)
				assert(isNever(res))
			}) */
		})

		describe('ap', () => {
			it('should behave like apply for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(f)
				const q = fulfill(1)
				const res = promise.ap(q)
				resolve(p)
				return assertSame(p.ap(q), res)
			})

			it('should behave like rejected for reject', () => {
				const { resolve, promise } = future()
				const p = silenced(reject(f))
				const res = promise.ap(fulfill(1))
				resolve(p)
				return assertSame(p, res)
			})

			/* it('should have never state for never (#30)', () => {
				const { resolve, promise } = future()
				const p = never()
				const res = promise.ap(fulfill(1))
				resolve(p)
				assert(isNever(res))
			}) */
		})

		describe('chain', () => {
			it('should behave like chained for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.chain(fp)
				resolve(p)
				return assertSame(p.chain(fp), res)
			})

			it('should behave like rejection chained for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.chain(rp)
				resolve(p)
				return assertSame(p.chain(rp), res)
			})

			it('should behave like rejected for reject', () => {
				const { resolve, promise } = future()
				const p = silenced(reject(1))
				const res = promise.chain(fp)
				resolve(p)
				return assertSame(p, res)
			})

			/* it('should have never state for never (#30)', () => {
				const { resolve, promise } = future()
				const p = never()
				const res = promise.chain(fp)
				resolve(p)
				assert(isNever(res))
			}) */
		})

		describe('concat', () => {
			it('should behave like fulfilled other for fulfill', () => {
				const { resolve, promise } = future()
				const p = fulfill(2)
				const res = promise.concat(p)
				resolve(fulfill(1))
				return assertSame(p, res)
			})

			it('should behave like rejected other for fulfill', () => {
				const { resolve, promise } = future()
				const p = silenced(reject(2))
				const res = promise.concat(p)
				resolve(fulfill(1))
				return assertSame(p, res)
			})

			it('should behave like fulfilled other for reject', () => {
				const { resolve, promise } = future()
				const p = fulfill(2)
				const res = promise.concat(p)
				resolve(silenced(reject(1)))
				return assertSame(p, res)
			})

			it('should behave like rejected other for reject', () => {
				const { resolve, promise } = future()
				const p = silenced(reject(2))
				const res = promise.concat(p)
				resolve(silenced(reject(1)))
				return assertSame(p, res)
			})

			it('should behave like other for never', () => {
				const { resolve, promise } = future()
				const p = fulfill(2)
				const res = promise.concat(p)
				resolve(never())
				return assertSame(p, res)
			})
		})
	})
})
