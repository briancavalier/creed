import { describe, it } from 'mocha'
import { future, fulfill, reject, never, CancelToken, all } from '../src/main'
import { silentReject } from '../src/Promise'
import { assertSame, raceCallbacks } from './lib/test-util'
import assert from 'assert'

describe('untilCancel', () => {
	it('should always return a promise with the token on its .token property', () => {
		const {token, cancel} = CancelToken.source()

		assert.strictEqual(never().untilCancel(token).token, token, 'never')
		assert.strictEqual(future().promise.untilCancel(token).token, token, 'unresolved future')
		assert.strictEqual(future(token).promise.untilCancel(token).token, token, 'unresolved future with same token')
		assert.strictEqual(future(CancelToken.empty()).promise.untilCancel(token).token, token, 'unresolved future with other token')

		cancel({})

		assert.strictEqual(fulfill().untilCancel(token).token, token, 'fulfill')
		assert.strictEqual(reject().untilCancel(token).token, token, 'reject')
		assert.strictEqual(never().untilCancel(token).token, token, 'never')
		assert.strictEqual(future().promise.untilCancel(token).token, token, 'unresolved future')
		const a = future()
		a.resolve(fulfill())
		assert.strictEqual(a.promise.untilCancel(token).token, token, 'fulfilled future')
		const b = future()
		b.resolve(reject())
		assert.strictEqual(b.promise.untilCancel(token).token, token, 'rejected future')
		const c = future(token)
		assert.strictEqual(c.promise.untilCancel(token).token, token, 'future with token')
	})
})

describe('trifurcate', () => {
	const ful = () => 'f'
	const rej = () => 'r'
	const can = () => 'c'
	it('should behave like then without a token', () => {
		const a = future()
		const b = future()
		const c = future()
		const d = future()
		a.resolve(fulfill())
		b.resolve(reject())
		const res = all([
			assertSame(fulfill().trifurcate(ful, rej, can), fulfill().then(ful, rej)),
			assertSame( reject().trifurcate(ful, rej, can),  reject().then(ful, rej)),
			assertSame(a.promise.trifurcate(ful, rej, can), a.promise.then(ful, rej)),
			assertSame(b.promise.trifurcate(ful, rej, can), b.promise.then(ful, rej)),
			assertSame(c.promise.trifurcate(ful, rej, can), c.promise.then(ful, rej)),
			assertSame(d.promise.trifurcate(ful, rej, can), d.promise.then(ful, rej))
		])
		c.resolve(fulfill())
		d.resolve(reject())
		return res
	})

	const f = x => x + 1
	const fp = x => fulfill(x + 1)
	const rp = x => silentReject(x + 1)
	const tr = x => { throw x + 1 }

	describe('on fulfilled future', () => {
		it('should only call the onfulfilled callback', () => {
			const { ok, nok, result } = raceCallbacks(future)
			const { resolve, promise } = future(CancelToken.empty())
			resolve(fulfill(1))
			promise.trifurcate(ok, nok, nok)
			return result
		})

		it('should asynchronously call the callback', () => {
			const { resolve, promise } = future(CancelToken.empty())
			resolve(fulfill(1))
			let called = false
			const res = promise.trifurcate(() => {
				called = true
			})
			assert(!called)
			return res.then(() => assert(called))
		})

		it('should behave like the input without callback', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = fulfill(1)
			resolve(p)
			return assertSame(p, promise.trifurcate(undefined, assert.ifError, assert.ifError))
		})

		it('should behave like map', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = fulfill(1)
			resolve(p)
			return assertSame(p.map(f), promise.trifurcate(f, assert.ifError, assert.ifError))
		})

		it('should behave like chain with fulfillment', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = fulfill(1)
			resolve(p)
			return assertSame(p.chain(fp), promise.trifurcate(fp, assert.ifError, assert.ifError))
		})

		it('should behave like chain with rejection', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = fulfill(1)
			resolve(p)
			return assertSame(p.chain(rp), promise.trifurcate(rp, assert.ifError, assert.ifError))
		})

		it('should behave like then with exception', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = fulfill(1)
			resolve(p)
			return assertSame(p.then(tr), promise.trifurcate(tr, assert.ifError, assert.ifError))
		})
	})

	describe('on rejected future', () => {
		it('should only call the onrejected callback', () => {
			const { ok, nok, result } = raceCallbacks(future)
			const { resolve, promise } = future(CancelToken.empty())
			resolve(reject(1))
			promise.trifurcate(nok, ok, nok)
			return result
		})

		it('should asynchronously call the callback', () => {
			const { resolve, promise } = future(CancelToken.empty())
			resolve(reject(1))
			let called = false
			const res = promise.trifurcate(undefined, () => {
				called = true
			})
			assert(!called)
			return res.then(() => assert(called))
		})

		it('should behave like the input without callback', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = reject(1)
			resolve(p)
			return assertSame(p, promise.trifurcate(assert.ifError, undefined, assert.ifError))
		})

		it('should behave like catch', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = reject(1)
			resolve(p)
			return assertSame(p.catch(f), promise.trifurcate(assert.ifError, f, assert.ifError))
		})

		it('should behave like catch with fulfillment', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = reject(1)
			resolve(p)
			return assertSame(p.catch(fp), promise.trifurcate(assert.ifError, fp, assert.ifError))
		})

		it('should behave like catch with rejection', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = reject(1)
			resolve(p)
			return assertSame(p.catch(rp), promise.trifurcate(assert.ifError, rp, assert.ifError))
		})

		it('should behave like catch with exception', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = reject(1)
			resolve(p)
			return assertSame(p.catch(tr), promise.trifurcate(assert.ifError, tr, assert.ifError))
		})
	})

	describe('on cancelled future', () => {
		it('should only call the oncancelled callback', () => {
			const { ok, nok, result } = raceCallbacks(future)
			const { token, cancel } = CancelToken.source()
			const { promise } = future(token)
			cancel(1)
			promise.trifurcate(nok, nok, ok)
			return result
		})

		it('should asynchronously call the callback', () => {
			const { token, cancel } = CancelToken.source()
			const { promise } = future(token)
			cancel(1)
			let called = false
			const res = promise.trifurcate(undefined, undefined, () => {
				called = true
			})
			assert(!called)
			return res.then(() => assert(called))
		})

		it('should behave like rejected without callback', () => {
			const { token, cancel } = CancelToken.source()
			const { promise } = future(token)
			const expected = {}
			cancel(expected)
			return assertSame(reject(expected), promise.trifurcate(assert.ifError, assert.ifError, undefined))
		})

		it('should behave like subscribe', () => {
			const { token, cancel } = CancelToken.source()
			const { promise } = future(token)
			cancel(1)
			return assertSame(token.subscribe(f), promise.trifurcate(assert.ifError, assert.ifError, f))
		})

		it('should behave like subscribe with fulfillment', () => {
			const { token, cancel } = CancelToken.source()
			const { promise } = future(token)
			cancel(1)
			return assertSame(token.subscribe(fp), promise.trifurcate(assert.ifError, assert.ifError, fp))
		})

		it('should behave like subscribe with rejection', () => {
			const { token, cancel } = CancelToken.source()
			const { promise } = future(token)
			cancel(1)
			return assertSame(token.subscribe(rp), promise.trifurcate(assert.ifError, assert.ifError, rp))
		})

		it('should behave like subscribe with exception', () => {
			const { token, cancel } = CancelToken.source()
			const { promise } = future(token)
			cancel(1)
			return assertSame(token.subscribe(tr), promise.trifurcate(assert.ifError, assert.ifError, tr))
		})
	})

	describe('on future before fulfilled', () => {
		it('should only call the onfulfilled callback', () => {
			const { ok, nok, result } = raceCallbacks(future)
			const { resolve, promise } = future(CancelToken.empty())
			promise.trifurcate(ok, nok, nok)
			resolve(fulfill(1))
			return result
		})

		it('should asynchronously call the callback', () => {
			const { resolve, promise } = future(CancelToken.empty())
			let called = false
			const res = promise.trifurcate(() => {
				called = true
			})
			assert(!called)
			resolve(fulfill(1))
			assert(!called)
			return res.then(() => assert(called))
		})

		it('should behave like the input without callback', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = fulfill(1)
			const res = promise.trifurcate(undefined, assert.ifError, assert.ifError)
			resolve(p)
			return assertSame(res, p)
		})

		it('should behave like map', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = fulfill(1)
			const res = promise.trifurcate(f, assert.ifError, assert.ifError)
			resolve(p)
			return assertSame(res, p.map(f))
		})

		it('should behave like chain with fulfillment', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = fulfill(1)
			const res = promise.trifurcate(fp, assert.ifError, assert.ifError)
			resolve(p)
			return assertSame(res, p.chain(fp))
		})

		it('should behave like chain with rejection', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = fulfill(1)
			const res = promise.trifurcate(rp, assert.ifError, assert.ifError)
			resolve(p)
			return assertSame(res, p.chain(rp))
		})

		it('should behave like then with exception', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = fulfill(1)
			const res = promise.trifurcate(tr, assert.ifError, assert.ifError)
			resolve(p)
			return assertSame(res, p.then(tr))
		})
	})

	describe('on future before rejected', () => {
		it('should only call the onrejected callback', () => {
			const { ok, nok, result } = raceCallbacks(future)
			const { resolve, promise } = future(CancelToken.empty())
			promise.trifurcate(nok, ok, nok)
			resolve(reject(1))
			return result
		})

		it('should asynchronously call the callback', () => {
			const { resolve, promise } = future(CancelToken.empty())
			let called = false
			const res = promise.trifurcate(undefined, () => {
				called = true
			})
			assert(!called)
			resolve(reject(1))
			assert(!called)
			return res.then(() => assert(called))
		})

		it('should behave like the input without callback', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = reject(1)
			const res = promise.trifurcate(assert.ifError, undefined, assert.ifError)
			resolve(p)
			return assertSame(res, p)
		})

		it('should behave like catch', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = reject(1)
			const res = promise.trifurcate(assert.ifError, f, assert.ifError)
			resolve(p)
			return assertSame(res, p.catch(f))
		})

		it('should behave like catch with fulfillment', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = reject(1)
			const res = promise.trifurcate(assert.ifError, fp, assert.ifError)
			resolve(p)
			return assertSame(res, p.catch(fp))
		})

		it('should behave like catch with rejection', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = reject(1)
			const res = promise.trifurcate(assert.ifError, rp, assert.ifError)
			resolve(p)
			return assertSame(res, p.catch(rp))
		})

		it('should behave like catch with exception', () => {
			const { resolve, promise } = future(CancelToken.empty())
			const p = reject(1)
			const res = promise.trifurcate(assert.ifError, tr, assert.ifError)
			resolve(p)
			return assertSame(res, p.catch(tr))
		})
	})

	describe('on future before cancelled', () => {
		it('should only call the oncancelled callback', () => {
			const { ok, nok, result } = raceCallbacks(future)
			const { token, cancel } = CancelToken.source()
			const { promise } = future(token)
			promise.trifurcate(nok, nok, ok)
			cancel(1)
			return result
		})

		it('should asynchronously call the callback', () => {
			const { token, cancel } = CancelToken.source()
			const { promise } = future(token)
			let called = false
			const res = promise.trifurcate(undefined, undefined, () => {
				called = true
			})
			assert(!called)
			cancel(1)
			assert(!called)
			return res.then(() => assert(called))
		})

		it('should behave like rejected without callback', () => {
			const { token, cancel } = CancelToken.source()
			const { promise } = future(token)
			const expected = {}
			const res = promise.trifurcate(assert.ifError, assert.ifError, undefined)
			cancel(expected)
			return assertSame(res, reject(expected))
		})

		it('should behave like subscribe', () => {
			const { token, cancel } = CancelToken.source()
			const { promise } = future(token)
			const res = promise.trifurcate(assert.ifError, assert.ifError, f)
			cancel(1)
			return assertSame(res, token.subscribe(f))
		})

		it('should behave like subscribe with fulfillment', () => {
			const { token, cancel } = CancelToken.source()
			const { promise } = future(token)
			const res = promise.trifurcate(assert.ifError, assert.ifError, fp)
			cancel(1)
			return assertSame(res, token.subscribe(fp))
		})

		it('should behave like subscribe with rejection', () => {
			const { token, cancel } = CancelToken.source()
			const { promise } = future(token)
			const res = promise.trifurcate(assert.ifError, assert.ifError, rp)
			cancel(1)
			return assertSame(res, token.subscribe(rp))
		})

		it('should behave like subscribe with exception', () => {
			const { token, cancel } = CancelToken.source()
			const { promise } = future(token)
			const res = promise.trifurcate(assert.ifError, assert.ifError, tr)
			cancel(1)
			return assertSame(res, token.subscribe(tr))
		})
	})

	const pre = (f, g) => x => (f({}), g(x))

	describe('on future before fulfilled even when cancelled from the callback', () => {
		it('should only call the onfulfilled callback', () => {
			const { ok, nok, result } = raceCallbacks(future)
			const { token, cancel } = CancelToken.source()
			const { resolve, promise } = future(token)
			promise.trifurcate(pre(cancel, ok), nok, nok)
			resolve(fulfill(1))
			return result
		})

		it('should behave like map', () => {
			const { token, cancel } = CancelToken.source()
			const { resolve, promise } = future(token)
			const p = fulfill(1)
			const res = promise.trifurcate(pre(cancel, f), assert.ifError, assert.ifError)
			resolve(p)
			return assertSame(res, p.map(f))
		})

		it('should behave like chain with fulfillment', () => {
			const { token, cancel } = CancelToken.source()
			const { resolve, promise } = future(token)
			const p = fulfill(1)
			const res = promise.trifurcate(pre(cancel, fp), assert.ifError, assert.ifError)
			resolve(p)
			return assertSame(res, p.chain(fp))
		})

		it('should behave like chain with rejection', () => {
			const { token, cancel } = CancelToken.source()
			const { resolve, promise } = future(token)
			const p = fulfill(1)
			const res = promise.trifurcate(pre(cancel, rp), assert.ifError, assert.ifError)
			resolve(p)
			return assertSame(res, p.chain(rp))
		})

		it('should behave like then with exception', () => {
			const { token, cancel } = CancelToken.source()
			const { resolve, promise } = future(token)
			const p = fulfill(1)
			const res = promise.trifurcate(pre(cancel, tr), assert.ifError, assert.ifError)
			resolve(p)
			return assertSame(res, p.then(tr))
		})
	})

	describe('on future before rejected even when cancelled from the callback', () => {
		it('should only call the onrejected callback', () => {
			const { ok, nok, result } = raceCallbacks(future)
			const { token, cancel } = CancelToken.source()
			const { resolve, promise } = future(token)
			promise.trifurcate(nok, pre(cancel, ok), nok)
			resolve(reject(1))
			return result
		})

		it('should behave like catch', () => {
			const { token, cancel } = CancelToken.source()
			const { resolve, promise } = future(token)
			const p = reject(1)
			const res = promise.trifurcate(assert.ifError, pre(cancel, f), assert.ifError)
			resolve(p)
			return assertSame(res, p.catch(f))
		})

		it('should behave like catch with fulfillment', () => {
			const { token, cancel } = CancelToken.source()
			const { resolve, promise } = future(token)
			const p = reject(1)
			const res = promise.trifurcate(assert.ifError, pre(cancel, fp), assert.ifError)
			resolve(p)
			return assertSame(res, p.catch(fp))
		})

		it('should behave like catch with rejection', () => {
			const { token, cancel } = CancelToken.source()
			const { resolve, promise } = future(token)
			const p = reject(1)
			const res = promise.trifurcate(assert.ifError, pre(cancel, rp), assert.ifError)
			resolve(p)
			return assertSame(res, p.catch(rp))
		})

		it('should behave like catch with exception', () => {
			const { token, cancel } = CancelToken.source()
			const { resolve, promise } = future(token)
			const p = reject(1)
			const res = promise.trifurcate(assert.ifError, pre(cancel, tr), assert.ifError)
			resolve(p)
			return assertSame(res, p.catch(tr))
		})
	})
})
