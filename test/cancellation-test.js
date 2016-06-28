import { describe, it } from 'mocha'
import { future, reject, fulfill, never, isRejected, CancelToken } from '../src/main'
import { silenceError } from '../src/Promise'
import { assertSame } from './lib/test-util'
import assert from 'assert'

const silenced = p => (silenceError(p), p)
const f = x => x + 1
const fp = x => fulfill(x + 1)
const rp = x => silenced(reject(x))

// cancellation tests for method calls on already settled or never-resolved promises
// with already cancelled or never cancelled tokens
// can be found in fulfill-test.js, reject-test-js and never-test.js

describe('fulfill', () => {
	describe('when being cancelled immediately after', () => {
		describe('then', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const res = fulfill(1).then(assert.ifError, null, token)
				cancel({})
				return assertSame(token.getRejected(), res)
			})
		})

		/* describe('catch', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const res = fulfill(1).catch(assert.ifError, token)
				cancel({})
				return assertSame(token.getRejected(), res)
			})
		}) */

		describe('map', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const res = fulfill(1).map(assert.ifError, token)
				cancel({})
				return assertSame(token.getRejected(), res)
			})
		})

		describe('ap', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const res = fulfill(assert.ifError).ap(fulfill(1), token)
				cancel({})
				return assertSame(token.getRejected(), res)
			})
		})

		describe('chain', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const res = fulfill(1).chain(assert.ifError, token)
				cancel({})
				return assertSame(token.getRejected(), res)
			})
		})
	})

	describe('when being cancelled after resolution just before the handler', () => {
		describe('then', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				fulfill(1).then(() => cancel({}))
				const res = fulfill(1).then(assert.ifError, null, token)
				return assertSame(token.getRejected(), res)
			})
		})

		/* describe('catch', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				fulfill(1).then(() => cancel({}))
				const res = fulfill(1).catch(assert.ifError, token)
				return assertSame(token.getRejected(), res)
			})
		}) */

		describe('map', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				fulfill(1).then(() => cancel({}))
				const res = fulfill(1).map(assert.ifError, token)
				return assertSame(token.getRejected(), res)
			})
		})

		describe('ap', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				fulfill(1).then(() => cancel({}))
				const res = fulfill(assert.ifError).ap(fulfill(1), token)
				return assertSame(token.getRejected(), res)
			})
		})

		describe('chain', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				fulfill(1).then(() => cancel({}))
				const res = fulfill(1).chain(assert.ifError, token)
				return assertSame(token.getRejected(), res)
			})
		})
	})

	describe('when being cancelled from the handler', () => {
		describe('then', () => {
			it('should behave like cancellation and ignore exceptions for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const res = fulfill(1).then(() => {
					cancel({})
					throw new Error()
				}, null, token)
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const res = fulfill(1).then(() => cancel({}), null, token)
				return assertSame(token.getRejected(), res)
			})
		})

		describe('map', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const res = fulfill(1).map(() => cancel({}), token)
				return assertSame(token.getRejected(), res)
			})
		})

		describe('ap', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const res = fulfill(() => cancel({})).ap(fulfill(1), token)
				return assertSame(token.getRejected(), res)
			})
		})

		describe('chain', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const res = fulfill(1).chain(() => cancel({}), token)
				return assertSame(token.getRejected(), res)
			})
		})
	})

	describe('when being cancelled after the handler', () => {
		describe('then', () => {
			it('should behave like mapped for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const promise = fulfill(1)
				const res = promise.then(f, null, token)
				promise.then(() => cancel({}))
				return assertSame(promise.map(f), res)
			})

			it('should behave like chained for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const promise = fulfill(1)
				const res = promise.then(fp, null, token)
				promise.then(() => cancel({}))
				return assertSame(promise.chain(fp), res)
			})

			it('should behave like rejection chained for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const promise = fulfill(1)
				const res = promise.then(rp, null, token)
				promise.then(() => cancel({}))
				return assertSame(promise.chain(rp), res)
			})
		})

		/* describe('catch', () => {
			it('should behave like fulfillment for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const promise = fulfill(1)
				const res = promise.catch(f, token)
				promise.then(() => cancel({}))
				return assertSame(promise, res)
			})
		}) */

		describe('map', () => {
			it('should behave like mapped for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const promise = fulfill(1)
				const res = promise.map(f, token)
				promise.then(() => cancel({}))
				return assertSame(promise.map(f), res)
			})
		})

		describe('ap', () => {
			it('should behave like apply for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const promise = fulfill(f)
				const q = fulfill(1)
				const res = promise.ap(q, token)
				promise.ap(q).then(() => cancel({}))
				return assertSame(promise.ap(q), res)
			})
		})

		describe('chain', () => {
			it('should behave like chained for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const promise = fulfill(1)
				const res = promise.chain(fp, token)
				promise.then(() => cancel({}))
				return assertSame(promise.chain(fp), res)
			})

			it('should behave like rejection chained for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const promise = fulfill(1)
				const res = promise.chain(rp, token)
				promise.then(() => cancel({}))
				return assertSame(promise.chain(rp), res)
			})
		})
	})
})

describe('reject', () => {
	describe('when being cancelled immediately after', () => {
		describe('catch', () => {
			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const res = silenced(reject(1)).catch(assert.ifError, token)
				cancel({})
				return assertSame(token.getRejected(), res)
			})
		})

		/* describe('then', () => {
			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const res = silenced(reject(1)).then(assert.ifError, null, token)
				cancel({})
				return assertSame(token.getRejected(), res)
			})
		})

		describe('map', () => {
			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const res = silenced(reject(1)).map(assert.ifError, token)
				cancel({})
				return assertSame(token.getRejected(), res)
			})
		})

		describe('ap', () => {
			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const res = silenced(reject(1)).ap(fulfill(1), token)
				cancel({})
				return assertSame(token.getRejected(), res)
			})
		})

		describe('chain', () => {
			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const res = silenced(reject(1)).chain(assert.ifError, token)
				cancel({})
				return assertSame(token.getRejected(), res)
			})
		}) */
	})

	describe('when being cancelled after resolution just before the handler', () => {
		describe('catch', () => {
			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				reject(1).catch(() => cancel({}))
				const res = silenced(reject(1)).catch(assert.ifError, token)
				return assertSame(token.getRejected(), res)
			})
		})

		/* describe('then', () => {
			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				reject(1).catch(() => cancel({}))
				const res = silenced(reject(1)).then(assert.ifError, null, token)
				return assertSame(token.getRejected(), res)
			})
		})

		describe('map', () => {
			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				reject(1).catch(() => cancel({}))
				const res = silenced(reject(1)).map(assert.ifError, token)
				return assertSame(token.getRejected(), res)
			})
		})

		describe('ap', () => {
			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				reject(1).catch(() => cancel({}))
				const res = silenced(reject(1)).ap(fulfill(1), token)
				return assertSame(token.getRejected(), res)
			})
		})

		describe('chain', () => {
			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				reject(1).catch(() => cancel({}))
				const res = silenced(reject(1)).chain(assert.ifError, token)
				return assertSame(token.getRejected(), res)
			})
		}) */
	})

	describe('when being cancelled from the handler', () => {
		describe('catch', () => {
			it('should behave like cancellation and ignore exceptions for reject', () => {
				const { token, cancel } = CancelToken.source()
				const res = reject(1).catch(() => {
					cancel({})
					throw new Error()
				}, token)
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const res = silenced(reject(1)).catch(() => cancel({}), token)
				return assertSame(token.getRejected(), res)
			})
		})
	})

	describe('when being cancelled after the handler', () => {
		describe('catch', () => {
			it('should behave like mapped for reject', () => {
				const { token, cancel } = CancelToken.source()
				const promise = reject(1)
				const res = promise.catch(f, token)
				promise.catch(() => cancel({}))
				return assertSame(promise.catch(f), res)
			})

			it('should behave like chained for reject', () => {
				const { token, cancel } = CancelToken.source()
				const promise = reject(1)
				const res = promise.catch(fp, token)
				promise.catch(() => cancel({}))
				return assertSame(promise.catch(fp), res)
			})

			it('should behave like rejection chained for reject', () => {
				const { token, cancel } = CancelToken.source()
				const promise = reject(1)
				const res = promise.catch(rp, token)
				promise.catch(() => cancel({}))
				return assertSame(promise.catch(rp), res)
			})
		})

		/* describe('then', () => {
			it('should behave like rejection for reject', () => {
				const { token, cancel } = CancelToken.source()
				const promise = silenced(reject(1))
				const res = promise.then(f, null, token)
				promise.catch(() => cancel({}))
				return assertSame(promise, res)
			})
		})

		describe('map', () => {
			it('should behave like rejection for reject', () => {
				const { token, cancel } = CancelToken.source()
				const promise = silenced(reject(1))
				const res = promise.map(f, token)
				promise.catch(() => cancel({}))
				return assertSame(promise, res)
			})
		})

		describe('ap', () => {
			it('should behave like rejection for reject', () => {
				const { token, cancel } = CancelToken.source()
				const promise = silenced(reject(f))
				const res = promise.ap(fulfill(1), token)
				promise.catch(() => cancel({}))
				return assertSame(promise, res)
			})
		})

		describe('chain', () => {
			it('should behave like rejection for reject', () => {
				const { token, cancel } = CancelToken.source()
				const promise = silenced(reject(1))
				const res = promise.chain(fp, token)
				promise.catch(() => cancel({}))
				return assertSame(promise, res)
			})
		}) */
	})
})

describe('future', () => {
	describe('then without callbacks', () => {
		it('should behave like cancellation when cancelled', () => {
			const { token, cancel } = CancelToken.source()
			const { promise } = future()
			const res = promise.then(null, null, token)
			cancel({})
			return assertSame(token.getRejected(), res)
		})

		it('should behave like cancellation when cancelled for never', () => {
			const { token, cancel } = CancelToken.source()
			const { resolve, promise } = future()
			const res = promise.then(null, null, token)
			resolve(never())
			cancel({})
			return assertSame(token.getRejected(), res)
		})

		it('should behave like fulfillment when never cancelled for fulfill', () => {
			const { token } = CancelToken.source()
			const { resolve, promise } = future()
			const p = fulfill(1)
			const res = promise.then(null, null, token)
			resolve(p)
			return assertSame(p, res)
		})

		it('should behave like rejection when never cancelled for reject', () => {
			const { token } = CancelToken.source()
			const { resolve, promise } = future()
			const p = reject(1)
			const res = promise.then(null, null, token)
			resolve(p)
			return assertSame(p, res)
		})
	})

	describe('when not being cancelled', () => {
		describe('then', () => {
			it('should behave like mapped for fulfill', () => {
				const { token } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.then(f, null, token)
				resolve(p)
				return assertSame(p.map(f), res)
			})

			it('should behave like chained for fulfill', () => {
				const { token } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.then(fp, null, token)
				resolve(p)
				return assertSame(p.chain(fp), res)
			})

			it('should behave like rejection chained for fulfill', () => {
				const { token } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.then(rp, null, token)
				resolve(p)
				return assertSame(p.chain(rp), res)
			})

			it('should behave like rejection for reject', () => {
				const { token } = CancelToken.source()
				const { resolve, promise } = future()
				const p = silenced(reject(1))
				const res = promise.then(f, null, token)
				resolve(p)
				return assertSame(p, res)
			})
		})

		describe('catch', () => {
			it('should behave like fulfillment for fulfill', () => {
				const { token } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.catch(f, token)
				resolve(p)
				return assertSame(p, res)
			})

			it('should behave like mapped for reject', () => {
				const { token } = CancelToken.source()
				const { resolve, promise } = future()
				const p = reject(1)
				const res = promise.catch(f, token)
				resolve(p)
				return assertSame(p.catch(f), res)
			})

			it('should behave like chained for reject', () => {
				const { token } = CancelToken.source()
				const { resolve, promise } = future()
				const p = reject(1)
				const res = promise.catch(fp, token)
				resolve(p)
				return assertSame(p.catch(fp), res)
			})

			it('should behave like rejection chained for reject', () => {
				const { token } = CancelToken.source()
				const { resolve, promise } = future()
				const p = reject(1)
				const res = promise.catch(rp, token)
				resolve(p)
				return assertSame(p.catch(rp), res)
			})
		})

		describe('map', () => {
			it('should behave like mapped for fulfill', () => {
				const { token } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.map(f, token)
				resolve(p)
				return assertSame(p.map(f), res)
			})

			it('should behave like rejection for reject', () => {
				const { token } = CancelToken.source()
				const { resolve, promise } = future()
				const p = silenced(reject(1))
				const res = promise.map(f, token)
				resolve(p)
				return assertSame(p, res)
			})
		})

		describe('ap', () => {
			it('should behave like apply for fulfill', () => {
				const { token } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(f)
				const q = fulfill(1)
				const res = promise.ap(q, token)
				resolve(p)
				return assertSame(p.ap(q), res)
			})

			it('should behave like rejection for reject', () => {
				const { token } = CancelToken.source()
				const { resolve, promise } = future()
				const p = silenced(reject(f))
				const res = promise.ap(fulfill(1), token)
				resolve(p)
				return assertSame(p, res)
			})
		})

		describe('chain', () => {
			it('should behave like chained for fulfill', () => {
				const { token } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.chain(fp, token)
				resolve(p)
				return assertSame(p.chain(fp), res)
			})

			it('should behave like rejection chained for fulfill', () => {
				const { token } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.chain(rp, token)
				resolve(p)
				return assertSame(p.chain(rp), res)
			})

			it('should behave like rejection for reject', () => {
				const { token } = CancelToken.source()
				const { resolve, promise } = future()
				const p = silenced(reject(1))
				const res = promise.chain(fp, token)
				resolve(p)
				return assertSame(p, res)
			})
		})
	})

	describe('when called with already cancelled token', () => {
		describe('then', () => {
			it('should return cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				cancel({})
				const res = promise.then(assert.ifError, null, token)
				resolve(fulfill(1))
				assert.strictEqual(token.getRejected(), res)
			})

			it('should return cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				cancel({})
				const res = promise.then(assert.ifError, null, token)
				resolve(silenced(reject(1)))
				assert.strictEqual(token.getRejected(), res)
			})
		})

		describe('catch', () => {
			it('should return cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				cancel({})
				const res = promise.catch(assert.ifError, token)
				resolve(fulfill(1))
				assert.strictEqual(token.getRejected(), res)
			})

			it('should return cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				cancel({})
				const res = promise.catch(assert.ifError, token)
				resolve(silenced(reject(1)))
				assert.strictEqual(token.getRejected(), res)
			})
		})

		describe('map', () => {
			it('should return cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				cancel({})
				const res = promise.map(assert.ifError, token)
				resolve(fulfill(1))
				assert.strictEqual(token.getRejected(), res)
			})

			it('should return cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				cancel({})
				const res = promise.map(assert.ifError, token)
				resolve(silenced(reject(1)))
				assert.strictEqual(token.getRejected(), res)
			})
		})

		describe('ap', () => {
			it('should return cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				cancel({})
				const res = promise.ap(fulfill(1), token)
				resolve(fulfill(assert.ifError))
				assert.strictEqual(token.getRejected(), res)
			})

			it('should return cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				cancel({})
				const res = promise.ap(fulfill(1), token)
				resolve(silenced(reject(1)))
				assert.strictEqual(token.getRejected(), res)
			})
		})

		describe('chain', () => {
			it('should return cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				cancel({})
				const res = promise.chain(assert.ifError, token)
				resolve(fulfill(1))
				assert.strictEqual(token.getRejected(), res)
			})

			it('should return cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				cancel({})
				const res = promise.chain(assert.ifError, token)
				resolve(silenced(reject(1)))
				assert.strictEqual(token.getRejected(), res)
			})
		})
	})

	describe('when being cancelled and never resolved', () => {
		describe('then', () => {
			it('should behave like cancellation', () => {
				const { token, cancel } = CancelToken.source()
				const { promise } = future()
				const res = promise.then(assert.ifError, null, token)
				cancel({})
				assert(isRejected(res))
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for never', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.then(assert.ifError, null, token)
				resolve(never())
				cancel({})
				assert(isRejected(res))
				return assertSame(token.getRejected(), res)
			})
		})

		describe('catch', () => {
			it('should behave like cancellation', () => {
				const { token, cancel } = CancelToken.source()
				const { promise } = future()
				const res = promise.catch(assert.ifError, token)
				cancel({})
				assert(isRejected(res))
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for never', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.catch(assert.ifError, token)
				resolve(never())
				cancel({})
				assert(isRejected(res))
				return assertSame(token.getRejected(), res)
			})
		})

		describe('map', () => {
			it('should behave like cancellation', () => {
				const { token, cancel } = CancelToken.source()
				const { promise } = future()
				const res = promise.map(assert.ifError, token)
				cancel({})
				assert(isRejected(res))
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for never', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.map(assert.ifError, token)
				resolve(never())
				cancel({})
				assert(isRejected(res))
				return assertSame(token.getRejected(), res)
			})
		})

		describe('ap', () => {
			it('should behave like cancellation', () => {
				const { token, cancel } = CancelToken.source()
				const { promise } = future()
				const res = promise.ap(fulfill(1), token)
				cancel({})
				assert(isRejected(res))
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for never', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.ap(fulfill(1), token)
				resolve(never())
				cancel({})
				assert(isRejected(res))
				return assertSame(token.getRejected(), res)
			})
		})

		describe('chain', () => {
			it('should behave like cancellation', () => {
				const { token, cancel } = CancelToken.source()
				const { promise } = future()
				const res = promise.chain(assert.ifError, token)
				cancel({})
				assert(isRejected(res))
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for never', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.chain(assert.ifError, token)
				resolve(never())
				cancel({})
				assert(isRejected(res))
				return assertSame(token.getRejected(), res)
			})
		})
	})

	describe('when being cancelled before resolution', () => {
		describe('then', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.then(assert.ifError, null, token)
				cancel({})
				resolve(fulfill(1))
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.then(assert.ifError, null, token)
				cancel({})
				resolve(silenced(reject(1)))
				return assertSame(token.getRejected(), res)
			})
		})

		describe('catch', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.catch(assert.ifError, token)
				cancel({})
				resolve(fulfill(1))
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.catch(assert.ifError, token)
				cancel({})
				resolve(silenced(reject(1)))
				return assertSame(token.getRejected(), res)
			})
		})

		describe('map', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.map(assert.ifError, token)
				cancel({})
				resolve(fulfill(1))
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.map(assert.ifError, token)
				cancel({})
				resolve(silenced(reject(1)))
				return assertSame(token.getRejected(), res)
			})
		})

		describe('ap', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.ap(fulfill(1), token)
				cancel({})
				resolve(fulfill(assert.ifError))
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.ap(fulfill(1), token)
				cancel({})
				resolve(silenced(reject(1)))
				return assertSame(token.getRejected(), res)
			})
		})

		describe('chain', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.chain(assert.ifError, token)
				cancel({})
				resolve(fulfill(1))
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.chain(assert.ifError, token)
				cancel({})
				resolve(silenced(reject(1)))
				return assertSame(token.getRejected(), res)
			})
		})
	})

	describe('when being cancelled after resolution', () => {
		describe('then', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.then(assert.ifError, null, token)
				resolve(fulfill(1))
				cancel({})
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.then(assert.ifError, null, token)
				resolve(silenced(reject(1)))
				cancel({})
				return assertSame(token.getRejected(), res)
			})
		})

		describe('catch', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.catch(assert.ifError, token)
				resolve(fulfill(1))
				cancel({})
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.catch(assert.ifError, token)
				resolve(silenced(reject(1)))
				cancel({})
				return assertSame(token.getRejected(), res)
			})
		})

		describe('map', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.map(assert.ifError, token)
				resolve(fulfill(1))
				cancel({})
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.map(assert.ifError, token)
				resolve(silenced(reject(1)))
				cancel({})
				return assertSame(token.getRejected(), res)
			})
		})

		describe('ap', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.ap(fulfill(1), token)
				resolve(fulfill(assert.ifError))
				cancel({})
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.ap(fulfill(1), token)
				resolve(silenced(reject(1)))
				cancel({})
				return assertSame(token.getRejected(), res)
			})
		})

		describe('chain', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.chain(assert.ifError, token)
				resolve(fulfill(1))
				cancel({})
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.chain(assert.ifError, token)
				resolve(silenced(reject(1)))
				cancel({})
				return assertSame(token.getRejected(), res)
			})
		})
	})

	describe('when being cancelled after resolution just before the handler', () => {
		describe('then', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				promise.then(() => cancel({}))
				const res = promise.then(assert.ifError, null, token)
				resolve(fulfill(1))
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				promise.catch(() => cancel({}))
				const res = promise.then(assert.ifError, null, token)
				resolve(silenced(reject(1)))
				return assertSame(token.getRejected(), res)
			})
		})

		describe('catch', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				promise.then(() => cancel({}))
				const res = promise.catch(assert.ifError, token)
				resolve(fulfill(1))
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				promise.catch(() => cancel({}))
				const res = promise.catch(assert.ifError, token)
				resolve(silenced(reject(1)))
				return assertSame(token.getRejected(), res)
			})
		})

		describe('map', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				promise.then(() => cancel({}))
				const res = promise.map(assert.ifError, token)
				resolve(fulfill(1))
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				promise.catch(() => cancel({}))
				const res = promise.map(assert.ifError, token)
				resolve(silenced(reject(1)))
				return assertSame(token.getRejected(), res)
			})
		})

		describe('ap', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				promise.then(() => cancel({}))
				const res = promise.ap(fulfill(1), token)
				resolve(fulfill(assert.ifError))
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				promise.catch(() => cancel({}))
				const res = promise.ap(fulfill(1), token)
				resolve(silenced(reject(1)))
				return assertSame(token.getRejected(), res)
			})
		})

		describe('chain', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				promise.then(() => cancel({}))
				const res = promise.chain(assert.ifError, token)
				resolve(fulfill(1))
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				promise.catch(() => cancel({}))
				const res = promise.chain(assert.ifError, token)
				resolve(silenced(reject(1)))
				return assertSame(token.getRejected(), res)
			})
		})
	})

	describe('when being cancelled from the handler', () => {
		/* alternative proposal
		const pre = (f, g) => x => (f({}), g(x))
		describe('then', () => {
			it('should behave like mapped for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.then(pre(cancel, f), null, token)
				resolve(p)
				return assertSame(p.map(f), res)
			})

			it('should behave like chained for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.then(pre(cancel, fp), null, token)
				resolve(p)
				return assertSame(p.chain(fp), res)
			})

			it('should behave like rejection chained for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.then(pre(cancel, rp), null, token)
				resolve(p)
				return assertSame(p.chain(rp), res)
			})
		})

		describe('catch', () => {
			it('should behave like mapped for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = reject(1)
				const res = promise.catch(pre(cancel, f), token)
				resolve(p)
				return assertSame(p.catch(f), res)
			})

			it('should behave like chained for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = reject(1)
				const res = promise.catch(pre(cancel, fp), token)
				resolve(p)
				return assertSame(p.catch(fp), res)
			})

			it('should behave like rejection chained for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = reject(1)
				const res = promise.catch(pre(cancel, rp), token)
				resolve(p)
				return assertSame(p.catch(rp), res)
			})
		})

		describe('map', () => {
			it('should behave like mapped for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.map(pre(cancel, f), token)
				resolve(p)
				return assertSame(p.map(f), res)
			})
		})

		describe('ap', () => {
			it('should behave like apply for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(pre(cancel, f))
				const q = fulfill(1)
				const res = promise.ap(q, token)
				resolve(p)
				return assertSame(fulfill(f).ap(q), res)
			})
		})

		describe('chain', () => {
			it('should behave like chained for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.chain(pre(cancel, fp), token)
				resolve(p)
				return assertSame(p.chain(fp), res)
			})

			it('should behave like rejection chained for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.chain(pre(cancel, rp), token)
				resolve(p)
				return assertSame(p.chain(rp), res)
			})
		}) */

		describe('then', () => {
			it('should behave like cancellation and ignore exceptions for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.then(() => {
					cancel({})
					throw new Error()
				}, null, token)
				resolve(fulfill(1))
				return assertSame(token.getRejected(), res)
			})

			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.then(() => cancel({}), null, token)
				resolve(fulfill(1))
				return assertSame(token.getRejected(), res)
			})
		})

		describe('catch', () => {
			it('should behave like cancellation for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.catch(() => cancel({}), token)
				resolve(silenced(reject(1)))
				return assertSame(token.getRejected(), res)
			})
		})

		describe('map', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.map(() => cancel({}), token)
				resolve(fulfill(1))
				return assertSame(token.getRejected(), res)
			})
		})

		describe('ap', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.ap(fulfill(1), token)
				resolve(fulfill(() => cancel({})))
				return assertSame(token.getRejected(), res)
			})
		})

		describe('chain', () => {
			it('should behave like cancellation for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const res = promise.chain(() => cancel({}), token)
				resolve(fulfill(1))
				return assertSame(token.getRejected(), res)
			})
		})
	})

	describe('when being cancelled after the handler', () => {
		describe('then', () => {
			it('should behave like mapped for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.then(f, null, token)
				promise.then(() => cancel({}))
				resolve(p)
				return assertSame(p.map(f), res)
			})

			it('should behave like chained for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.then(fp, null, token)
				promise.then(() => cancel({}))
				resolve(p)
				return assertSame(p.chain(fp), res)
			})

			it('should behave like rejection chained for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.then(rp, null, token)
				promise.then(() => cancel({}))
				resolve(p)
				return assertSame(p.chain(rp), res)
			})

			it('should behave like rejection for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = silenced(reject(1))
				const res = promise.then(f, null, token)
				promise.catch(() => cancel({}))
				resolve(p)
				return assertSame(p, res)
			})
		})

		describe('catch', () => {
			it('should behave like fulfillment for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.catch(f, token)
				promise.then(() => cancel({}))
				resolve(p)
				return assertSame(p, res)
			})

			it('should behave like mapped for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = reject(1)
				const res = promise.catch(f, token)
				promise.catch(() => cancel({}))
				resolve(p)
				return assertSame(p.catch(f), res)
			})

			it('should behave like chained for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = reject(1)
				const res = promise.catch(fp, token)
				promise.catch(() => cancel({}))
				resolve(p)
				return assertSame(p.catch(fp), res)
			})

			it('should behave like rejection chained for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = reject(1)
				const res = promise.catch(rp, token)
				promise.catch(() => cancel({}))
				resolve(p)
				return assertSame(p.catch(rp), res)
			})
		})

		describe('map', () => {
			it('should behave like mapped for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.map(f, token)
				promise.then(() => cancel({}))
				resolve(p)
				return assertSame(p.map(f), res)
			})

			it('should behave like rejection for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = silenced(reject(1))
				const res = promise.map(f, token)
				promise.catch(() => cancel({}))
				resolve(p)
				return assertSame(p, res)
			})
		})

		describe('ap', () => {
			it('should behave like apply for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(f)
				const q = fulfill(1)
				const res = promise.ap(q, token)
				promise.ap(q).then(() => cancel({}))
				resolve(p)
				return assertSame(p.ap(q), res)
			})

			it('should behave like rejection for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = silenced(reject(f))
				const res = promise.ap(fulfill(1), token)
				promise.catch(() => cancel({}))
				resolve(p)
				return assertSame(p, res)
			})
		})

		describe('chain', () => {
			it('should behave like chained for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.chain(fp, token)
				promise.then(() => cancel({}))
				resolve(p)
				return assertSame(p.chain(fp), res)
			})

			it('should behave like rejection chained for fulfill', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = fulfill(1)
				const res = promise.chain(rp, token)
				promise.then(() => cancel({}))
				resolve(p)
				return assertSame(p.chain(rp), res)
			})

			it('should behave like rejection for reject', () => {
				const { token, cancel } = CancelToken.source()
				const { resolve, promise } = future()
				const p = silenced(reject(1))
				const res = promise.chain(fp, token)
				promise.catch(() => cancel({}))
				resolve(p)
				return assertSame(p, res)
			})
		})
	})
})