import { describe, it } from 'mocha'
import { CancelToken, isCancelled, isPending, getReason, future, all } from '../src/main'
import { assertSame, FakeCancelAction } from './lib/test-util'
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

	describe('getCancelled()', () => {
		it('should return a cancelled promise after the token was cancelled', () => {
			const {token, cancel} = CancelToken.source()
			cancel()
			assert(isCancelled(token.getCancelled()))
		})

		it('should return a pending promise until the token is cancelled', () => {
			const {token, cancel} = CancelToken.source()
			const p = token.getCancelled()
			assert(isPending(p))
			cancel()
			assert(isCancelled(p))
		})

		it('should cancel with the argument of the first cancel call', () => {
			const {token, cancel} = CancelToken.source()
			const r = {}
			cancel(r)
			cancel({})
			const p = token.getCancelled()
			cancel({})
			return p.trifurcate(assert.ifError, assert.ifError, e => {
				assert.strictEqual(e, r)
			})
		})

		it('should return a pending promise until the token is asynchronously cancelled', () => {
			const {token, cancel} = CancelToken.source()
			const p = token.getCancelled()
			const r = {}
			setTimeout(() => {
				assert(isPending(p))
				assert(!token.requested)
				cancel(r)
			}, 5)
			return p.trifurcate(assert.ifError, assert.ifError, e => {
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
			const action = new FakeCancelAction({})
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

		it('should run subscriptions when already requested', () => {
			const {token, cancel} = CancelToken.source()
			const {resolve, promise} = future()
			const r = {}
			const action = new FakeCancelAction({})
			cancel(r)
			token._subscribe(action)
			assert(action.isCancelled)
		})
	})

	describe('subscribe()', () => {
		it('should asynchronously call subscriptions', () => {
			const {token, cancel} = CancelToken.source()
			const {resolve, promise} = future()
			token.subscribe(resolve)
			cancel()
			assert(isPending(promise))
			return promise
		})

		it('should return a promise for the result', () => {
			const {token, cancel} = CancelToken.source()
			const expected = {}
			const p = token.subscribe(() => expected)
			assert.strictEqual(cancel()[0], p)
			return p.then(x => {
				assert.strictEqual(x, expected)
			})
		})

		it('should call subscriptions with the reason', () => {
			const {token, cancel} = CancelToken.source()
			const r = {}
			const p = token.subscribe(e => {
				assert.strictEqual(e, r)
			})
			cancel(r)
			return p
		})

		it('should not call subscriptions multiple times', () => {
			const {token, cancel} = CancelToken.source()
			let calls = 0
			const p = token.subscribe(() => {
				calls++
				assert.strictEqual(calls, 1)
			})
			assert.strictEqual(calls, 0)
			cancel()
			cancel()
			return p
		})

		it('should ignore exceptions thrown by subscriptions', () => {
			const {token, cancel} = CancelToken.source()
			let isCalled = false
			token.subscribe(() => { throw new Error() })
			const p = token.subscribe(e => {
				isCalled = true
			})
			cancel()
			return p.then(() => assert(isCalled))
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
			const a = token.subscribe(() => {
				assert.strictEqual(s, 0)
				s = 1
			})
			const b = token.subscribe(() => {
				assert.strictEqual(s, 1)
				s = 2
			})
			cancel()
			assert.strictEqual(s, 0)
			return all([a, b]).then(() => assert.strictEqual(s, 2))
		})

		it('should behave nearly like getCancelled().catch()', () => {
			const {token, cancel} = CancelToken.source()
			const p = token.subscribe(x => x)
			const q = token.getCancelled().catch(x => x)
			const res = cancel({})
			assert.strictEqual(res.length, 1)
			assert.strictEqual(res[0], p)
			return assertSame(p, q)
		})

		it('should behave like rejection for throw', () => {
			const {token, cancel} = CancelToken.source()
			const expected = {}
			const p = token.subscribe(() => { throw expected })
			assert.strictEqual(cancel()[0], p)
			return p.then(assert.ifError, x => assert.strictEqual(x, expected))
		})

		it('should call subscriptions before the token is cancelled', () => {
			const {token, cancel} = CancelToken.source()
			const expected = {}
			const p = token.subscribe(() => expected, CancelToken.empty())
			cancel()
			return p.then(x => assert.strictEqual(x, expected))
		})

		it('should not call subscriptions when the token is cancelled', () => {
			const a = CancelToken.source()
			const b = CancelToken.source()
			const p = a.token.subscribe(() => {
				throw new Error("should not be called")
			}, b.token)
			assert.strictEqual(p.token, b.token)
			b.cancel()
			a.cancel()
			return assertSame(p, b.token.getCancelled())
		})

		it('should return cancellation with already cancelled token', () => {
			const {token, cancel} = CancelToken.source()
			cancel()
			const p = CancelToken.empty().subscribe(() => {}, token)
			assert.strictEqual(p, token.getCancelled())
		})

		it('should behave like cancellation when token is cancelled from the subscription', () => {
			const a = CancelToken.source()
			const b = CancelToken.source()
			const p = a.token.subscribe(() => {
				b.cancel()
			}, b.token)
			assert.strictEqual(p.token, b.token)
			a.cancel()
			return assertSame(p, b.token.getCancelled())
		})

		it('should call subscriptions that are subscribed from the callback', () => {
			const {token, cancel} = CancelToken.source()
			const expected = {}
			const p = token.subscribe(() => token.subscribe(() => expected))
			assert.strictEqual(cancel().length, 1)
			return p.then(x => assert.strictEqual(x, expected))
		})
	})

	describe('subscribeOrCall()', () => {
		it('should invoke f if the token is cancelled before the call', () => {
			const {token, cancel} = CancelToken.source()
			const {resolve, promise} = future()
			let called = 0
			const call = token.subscribeOrCall(() => { called |= 1; resolve() }, () => { called |= 2 })
			assert.strictEqual(called, 0)
			cancel()
			return promise.then(() => {
				assert.strictEqual(called, 1)
				call()
				assert.strictEqual(called, 1)
			})
		})

		it('should invoke g immediately if the call happens before the cancellation', () => {
			const {token, cancel} = CancelToken.source()
			let called = 0
			const call = token.subscribeOrCall(() => { called |= 1 }, () => { called |= 2 })
			assert.strictEqual(called, 0)
			call()
			assert.strictEqual(called, 2)
			cancel()
			return token.subscribe(() => assert.strictEqual(called, 2))
		})

		it('should only invoke f if the call happens during the cancellation', () => {
			const {token, cancel} = CancelToken.source()
			const {resolve, promise} = future()
			let called = 0
			const call = token.subscribeOrCall(() => { called |= 1; call(); resolve() }, () => { called |= 2 })
			assert.strictEqual(called, 0)
			cancel()
			return promise.then(() => assert.strictEqual(called, 1))
		})

		it('should only invoke g if the token is cancelled during the call', () => {
			const {token, cancel} = CancelToken.source()
			let called = 0
			const call = token.subscribeOrCall(() => { called |= 1 }, () => { called |= 2; cancel() })
			assert.strictEqual(called, 0)
			call()
			assert.strictEqual(called, 2)
			return token.subscribe(() => assert.strictEqual(called, 2))
		})

		it('should cope with undefined g', () => {
			const {token, cancel} = CancelToken.source()
			let called = 0
			const call = token.subscribeOrCall(() => { called |= 1 })
			assert.strictEqual(called, 0)
			call()
			assert.strictEqual(called, 0)
			cancel()
			return token.subscribe(() => assert.strictEqual(called, 0))
		})

		it('should throw exceptions from g', () => {
			const expected = {}
			const call = CancelToken.empty().subscribeOrCall(() => {}, () => { throw expected })
			assert.throws(call, e => e === expected)
		})

		it('should invoke g with the arguments and context of the call', () => {
			const o = {a: {}, b: []}
			const call = CancelToken.empty().subscribeOrCall(() => {}, function (a, b) {
				assert.strictEqual(this, o)
				assert.strictEqual(a, o.a)
				assert.strictEqual(b, o.b)
			})
			call.call(o, o.a, o.b)
		})

		it('should not invoke g multiple times', () => {
			let called = 0
			const call = CancelToken.empty().subscribeOrCall(() => {}, () => { called++ })
			assert.strictEqual(called, 0)
			call()
			assert.strictEqual(called, 1)
			call()
			assert.strictEqual(called, 1)
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
			return token.getCancelled().then(assert.ifError, e => assert.strictEqual(e, r))
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
			return token.getCancelled().then(assert.ifError, e => assert.strictEqual(e, r))
		})

		it('should cancel the result token when a is already cancelled', () => {
			const a = CancelToken.source()
			const b = CancelToken.source()
			const r = {}
			a.cancel(r)
			const token = a.token.concat(b.token)
			assert(token.requested)
			b.cancel({})
			return token.getCancelled().then(assert.ifError, e => assert.strictEqual(e, r))
		})

		it('should cancel the result token when b is already cancelled', () => {
			const a = CancelToken.source()
			const b = CancelToken.source()
			const r = {}
			b.cancel(r)
			const token = a.token.concat(b.token)
			assert(token.requested)
			a.cancel({})
			return token.getCancelled().then(assert.ifError, e => assert.strictEqual(e, r))
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
			return token.getCancelled().then(assert.ifError, e => assert.strictEqual(e, r))
		})
	})

	describe('static race()', () => {
		// see also concat test cases
		it('should ignore tokens added after cancellation', () => {
			const race = CancelToken.race()
			const a = CancelToken.source()
			race.add(a.token)
			const expected = {}
			a.cancel(expected)
			assert(race.get().requested)
			const b = CancelToken.source()
			b.cancel()
			race.add(b.token)
			assert(race.get().requested)
			return race.get().getCancelled().then(assert.ifError, e => {
				assert.strictEqual(e, expected)
				const c = CancelToken.source()
				race.add(c.token)
				assert(race.get().requested)
			})
		})

		it('should be requested faster than the subscription', () => {
			const {token, cancel} = CancelToken.source()
			token.subscribe(() => {
				assert(token.requested)
				assert(race.get().requested)
			})
			const race = CancelToken.race([token])
			return cancel()[0]
		})

		it('should ignore itself', () => {
			const {token, cancel} = CancelToken.source()
			const race = CancelToken.race()
			race.add(race.get())
			assert(!race.get().requested)
			race.add(token)
			cancel()
			assert(race.get().requested)
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
			return pool.get().getCancelled().then(assert.ifError, r => {
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
			return pool.get().getCancelled().then(assert.ifError, r => {
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
			return pool.get().getCancelled().then(assert.ifError, () => {
				const d = CancelToken.source()
				pool.add(d.token)
				assert(pool.get().requested)
			})
		})

		it('should be requested faster than the subscription', () => {
			const {token, cancel} = CancelToken.source()
			token.subscribe(() => {
				assert(token.requested)
				assert(pool.get().requested)
			})
			const pool = CancelToken.pool([token])
			return cancel()[0]
		})

		it('should ignore itself', () => {
			const {token, cancel} = CancelToken.source()
			const pool = CancelToken.pool()
			pool.add(pool.get())
			assert.strictEqual(pool.tokens.length, 0)
			assert(!pool.get().requested)
			pool.add(token)
			assert(!pool.get().requested)
			cancel()
			assert(pool.get().requested)
		})

		it('should reject if already-cancelled tokens are added', () => {
			const {token, cancel} = CancelToken.source()
			const expected = {}
			cancel(expected)
			assert(CancelToken.pool([token]).get().requested)
			const pool = CancelToken.pool()
			pool.add(token)
			return pool.get().getCancelled().then(assert.ifError, r => {
				assert.strictEqual(r.length, 1)
				assert.strictEqual(r[0], expected)
			})
		})
	})

	describe('static reference()', () => {
		it('should behave like the last assigned token', () => {
			const {token, cancel} = CancelToken.source()
			const ref = CancelToken.reference()
			assert(!ref.get().requested)
			ref.set(CancelToken.empty())
			assert(!ref.get().requested)
			ref.set(null)
			assert(!ref.get().requested)
			ref.set(token)
			assert(!ref.get().requested)
			cancel({})
			assert(ref.get().requested)
			return assertSame(token.getCancelled(), ref.get().getCancelled())
		})

		it('should throw when assigned to after cancellation', () => {
			const {token, cancel} = CancelToken.source()
			cancel()
			const ref = CancelToken.reference(token)
			assert(ref.get().requested)
			assert.throws(() => { ref.set(null) }, ReferenceError)
			assert.throws(() => { ref.set(CancelToken.empty()) }, ReferenceError)
		})

		it('should be requested faster than the subscription', () => {
			const {token, cancel} = CancelToken.source()
			token.subscribe(() => {
				assert(token.requested)
				assert(ref.get().requested)
			})
			const ref = CancelToken.reference(token)
			return cancel()[0]
		})

		it('should ignore itself', () => {
			const {token, cancel} = CancelToken.source()
			const ref = CancelToken.reference(token)
			ref.set(token)
			ref.set(ref.get())
			cancel()
			assert(ref.get().requested)
		})
	})
})
