import { describe, it } from 'mocha'
import { CancelToken, isRejected, isPending, getReason, future, reject } from '../src/main'
import { FakeCancelAction, raceCallbacks } from './lib/test-util'
import assert from 'assert'

describe('CancelToken', function () {
	describe('constructor', () => {
		it('should synchronously call the executor with a function', () => {
			let cancel
			new CancelToken(c => { cancel = c })
			assert.strictEqual(typeof cancel, 'function')
		})

		it('should throw synchronously when function not provided', () => {
			assert.throws(() => new CancelToken(), TypeError)
		})

		it('should not catch exceptions', () => {
			const err = new Error()
			assert.throws(() => {
				new CancelToken(() => { throw err })
			}, e => e === err)
		})
	})

	describe('static source()', () => {
		it('should return a token and a cancel function', () => {
			const {token, cancel} = CancelToken.source()
			assert(token instanceof CancelToken)
			assert.strictEqual(typeof cancel, 'function')
		})
	})

	it('should have a boolean .requested property', () => {
		const {token, cancel} = CancelToken.source()
		assert.strictEqual(token.requested, false)
		cancel()
		assert.strictEqual(token.requested, true)
	})

	describe('getRejected()', () => {
		it('should return a rejected promise after the token was cancelled', () => {
			const {token, cancel} = CancelToken.source()
			cancel()
			assert(isRejected(token.getRejected()))
		})

		it('should return a pending promise until the token is cancelled', () => {
			const {token, cancel} = CancelToken.source()
			const p = token.getRejected()
			assert(isPending(p))
			cancel()
			assert(isRejected(p))
		})

		it('should reject with the argument of the first cancel call', () => {
			const {token, cancel} = CancelToken.source()
			const r = {}
			cancel(r)
			cancel({})
			const p = token.getRejected()
			cancel({})
			return p.then(assert.ifError, e => {
				assert.strictEqual(e, r)
			})
		})

		it('should return a pending promise until the token is asynchronously cancelled', () => {
			const {token, cancel} = CancelToken.source()
			const p = token.getRejected()
			const r = {}
			setTimeout(() => {
				assert(isPending(p))
				assert(!token.requested)
				cancel(r)
			}, 5)
			return p.then(assert.ifError, e => {
				assert(token.requested)
				assert.strictEqual(e, r)
			})
		})
	})

	it('should be subclassible', () => {
		let constructorCalled = false
		let myCancel
		class MyCancelToken extends CancelToken {
			constructor (exec) {
				constructorCalled = true
				super(c => {
					assert.strictEqual(typeof c, 'function')
					myCancel = () => { c() }
					exec(myCancel)
				})
			}
		}
		const {token, cancel} = MyCancelToken.source()
		assert(constructorCalled)
		assert(token instanceof MyCancelToken)
		assert.strictEqual(cancel, myCancel)
		cancel()
		assert(token.requested)
	})

	describe('_subscribe()', () => {
		it('should synchronously run subscriptions', () => {
			const {token, cancel} = CancelToken.source()
			const r = {}
			const action = new FakeCancelAction({}, p => assert.strictEqual(getReason(p), r))
			token._subscribe(action)
			assert(!action.isCancelled)
			cancel(r)
			assert(action.isCancelled)
		})

		it('should not run subscriptions multiple times', () => {
			const {token, cancel} = CancelToken.source()
			const action = new FakeCancelAction({})
			token._subscribe(action)
			assert(!action.isCancelled)
			cancel()
			cancel()
			assert.strictEqual(action.isCancelled, 1)
		})

		it('should not run destroyed subscriptions', () => {
			const {token, cancel} = CancelToken.source()
			const action = new FakeCancelAction({})
			token._subscribe(action)
			action.destroy()
			assert(!action.promise)
			cancel()
			assert(!action.isCancelled)
		})

		it('should not run unsubscribed actions', () => {
			const {token, cancel} = CancelToken.source()
			const action = new FakeCancelAction({})
			token._subscribe(action)
			token._unsubscribe(action)
			cancel()
			assert(!action.isCancelled)
		})

		it('should do the same with lots of subscriptions', () => {
			const {token, cancel} = CancelToken.source()
			const active = new Set()
			const inactive = new Set()
			for (let i = 0; i < 150; i++) {
				if (active.size && Math.random() < 0.3) {
					const action = Array.from(active)[Math.floor(Math.pow(Math.random(), 1.5) * active.size)]
					if (Math.random() < 0.4) {
						action.destroy()
					} else {
						token._unsubscribe(action)
					}
					active.delete(action)
					inactive.add(action)
				} else {
					const action = new FakeCancelAction({})
					token._subscribe(action)
					active.add(action)
				}
			}
			// console.log(active.size, inactive.size)
			for (const action of active) assert(!action.isDestroyed && !action.isCancelled)
			cancel()
			for (const action of active) assert(action.isCancelled)
			for (const action of inactive) assert(!action.isCancelled)
		})

		it('should ignore exceptions thrown by subscriptions', () => {
			const {token, cancel} = CancelToken.source()
			const throwAction = new FakeCancelAction({}, () => { throw new Error() })
			token._subscribe(throwAction)
			const action = new FakeCancelAction({})
			token._subscribe(action)
			cancel()
			assert(action.isCancelled)
		})

		it('should run subscriptions when already requested', () => {
			const {token, cancel} = CancelToken.source()
			const {resolve, promise} = future()
			cancel()
			token._subscribe(new FakeCancelAction({}, p => resolve(getReason(p))))
			return promise
		})
	})

	describe('subscribe()', () => {
		it('should synchronously call subscriptions', () => {
			const {token, cancel} = CancelToken.source()
			const r = {}
			let isCalled = false
			token.subscribe(e => {
				isCalled = true
				assert.strictEqual(e, r)
			})
			assert(!isCalled)
			cancel(r)
			assert(isCalled)
		})

		it('should not call subscriptions multiple times', () => {
			const {token, cancel} = CancelToken.source()
			let calls = 0
			token.subscribe(() => {
				calls++
			})
			assert.strictEqual(calls, 0)
			cancel()
			cancel()
			assert.strictEqual(calls, 1)
		})

		it('should ignore exceptions thrown by subscriptions', () => {
			const {token, cancel} = CancelToken.source()
			let isCalled = false
			token.subscribe(() => { throw new Error() })
			token.subscribe(e => {
				isCalled = true
			})
			cancel()
			assert(isCalled)
		})

		it('should call subscriptions when already requested', () => {
			const {token, cancel} = CancelToken.source()
			const {resolve, promise} = future()
			cancel()
			token.subscribe(resolve)
			return promise
		})

		it('should call subscriptions in order', () => {
			const {token, cancel} = CancelToken.source()
			let s = 0
			token.subscribe(() => {
				assert.strictEqual(s, 0)
				s = 1
			})
			token.subscribe(() => {
				assert.strictEqual(s, 1)
				s = 2
			})
			cancel()
			assert.strictEqual(s, 2)
		})

		it('should call subscriptions when the promise is not settled', () => {
			const {token, cancel} = CancelToken.source()
			const {promise} = future()
			const {ok, result} = raceCallbacks(future)
			token.subscribe(ok, promise)
			cancel()
			return result
		})

		it('should not call subscriptions when the promise is fulfilled', () => {
			const {token, cancel} = CancelToken.source()
			const {resolve, promise} = future()
			const {ok, nok, result} = raceCallbacks(future)
			token.subscribe(nok, promise)
			promise.then(cancel).then(ok)
			resolve()
			return result
		})

		it('should not call subscriptions when the promise is rejected', () => {
			const {token, cancel} = CancelToken.source()
			const {resolve, promise} = future()
			const {ok, nok, result} = raceCallbacks(future)
			token.subscribe(nok, promise)
			promise.catch(cancel).then(ok)
			resolve(reject())
			return result
		})

		it('should return the token', () => {
			const {token} = CancelToken.source()
			assert.strictEqual(token.subscribe(() => {}), token)
		})
	})

	describe('concat()', () => {
		it('should cancel the result token when a is cancelled first', () => {
			const a = CancelToken.source()
			const b = CancelToken.source()
			const token = a.token.concat(b.token)
			const r = {}
			assert(!token.requested)
			a.cancel(r)
			assert(token.requested)
			b.cancel({})
			return token.getRejected().then(assert.ifError, e => assert.strictEqual(e, r))
		})

		it('should cancel the result token when b is cancelled first', () => {
			const a = CancelToken.source()
			const b = CancelToken.source()
			const token = a.token.concat(b.token)
			const r = {}
			assert(!token.requested)
			b.cancel(r)
			assert(token.requested)
			a.cancel({})
			return token.getRejected().then(assert.ifError, e => assert.strictEqual(e, r))
		})

		it('should cancel the result token when a is already cancelled', () => {
			const a = CancelToken.source()
			const b = CancelToken.source()
			const r = {}
			a.cancel(r)
			const token = a.token.concat(b.token)
			assert(token.requested)
			b.cancel({})
			return token.getRejected().then(assert.ifError, e => assert.strictEqual(e, r))
		})

		it('should cancel the result token when b is already cancelled', () => {
			const a = CancelToken.source()
			const b = CancelToken.source()
			const r = {}
			b.cancel(r)
			const token = a.token.concat(b.token)
			assert(token.requested)
			a.cancel({})
			return token.getRejected().then(assert.ifError, e => assert.strictEqual(e, r))
		})
	})

	describe('static empty()', () => {
		it('should produce a token that is never cancelled', () => {
			const token = CancelToken.empty()
			assert(token instanceof CancelToken)
			token.subscribe(() => {
				setTimeout(assert.ok, 0, false, 'must not be called')
			})
		})
	})

	describe('for()', () => {
		it('should cancel the token when the promise fulfills', () => {
			const {resolve, promise} = future()
			const token = CancelToken.for(promise)
			assert(!token.requested)
			const r = {}
			resolve(r)
			return token.getRejected().then(assert.ifError, e => assert.strictEqual(e, r))
		})
	})

	describe('static pool()', () => {
		it('should cancel when all tokens are cancelled', () => {
			const sources = []
			const reasons = []
			for (let i = 0; i < 5; i++) {
				sources.push(CancelToken.source())
				reasons.push({t: i})
			}
			const pool = CancelToken.pool(sources.map(s => s.token))
			for (let i = 0; i < sources.length; i++) {
				assert(!pool.get().requested)
				sources[i].cancel(reasons[i])
			}
			return pool.get().getRejected().then(assert.ifError, r => {
				assert.deepEqual(r, reasons)
			})
		})

		it('should allow tokens to be added before cancellation', () => {
			const pool = CancelToken.pool()
			const sources = []
			for (let i = 0; i < 5; i++) {
				sources[i] = CancelToken.source()
				sources[i].added = true
				pool.add(sources[i].token)
			}
			for (let i = 0; i < 15; i++) {
				sources.push(CancelToken.source())
			}
			const token = pool.get()
			while (sources.some(s => s.added && !s.token.requested)) {
				assert(!token.requested)
				let s = sources[Math.floor(Math.random() * sources.length)]
				if (s.added && s.token.requested) {
					s = sources[sources.length - 1]
					if (s.added && s.token.requested) {
						sources.pop()
						continue
					}
				}
				if (!s.added && Math.random() < 0.9) {
					if (Math.random() < 0.3) {
						const x = CancelToken.source()
						sources.push(x)
						pool.add(s.token, x.token)
						x.added = true
					} else {
						pool.add(s.token)
					}
					s.added = true
				} else if (!s.token.requested) {
					s.cancel()
				}
			}
			return pool.get().getRejected().then(assert.ifError, r => {
				assert(token.requested)
			})
		})

		it('should not allow tokens to be added after cancellation', () => {
			const pool = CancelToken.pool()
			const a = CancelToken.source()
			pool.add(a.token)
			const b = CancelToken.source()
			b.cancel()
			pool.add(b.token)
			const c = CancelToken.source()
			pool.add(c.token)
			c.cancel()
			a.cancel()
			return pool.get().getRejected().then(assert.ifError, () => {
				const d = CancelToken.source()
				pool.add(d.token)
				assert(pool.get().requested)
			})
		})
	})
})
