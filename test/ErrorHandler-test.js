import { describe, it } from 'mocha'
import '../src/Promise'
import { isHandled } from '../src/inspect'
import ErrorHandler from '../src/ErrorHandler'
import assert from 'assert'

function fakeError (value) {
	return {
		value,
		_state: 0,
		near () { return this },
		state () { return this._state },
		_runAction (a) { a.rejected(this) }
	}
}

describe('ErrorHandler', () => {
	describe('track', () => {
		it('should emit event immediately', () => {
			const value = {}
			const expected = fakeError(value)
			function fail (e) {
				assert.fail(e, expected, 'should not call reportError')
			}

			function verify (event, e, error) {
				assert.strictEqual(e, expected)
				assert.strictEqual(error, value)
				return true
			}

			const eh = new ErrorHandler(verify, fail)
			eh.track(expected)
		})

		it('should report error later', done => {
			const value = {}
			const expected = fakeError(value)
			function verify (e) {
				assert.strictEqual(e, expected)
				assert.strictEqual(e.value, value)
				done()
			}

			const eh = new ErrorHandler(() => false, verify)
			eh.track(expected)
		})
	})

	describe('untrack', () => {
		it('should emit event immediately', () => {
			const value = {}
			const expected = fakeError(value)
			function fail (e) {
				assert.fail(e, expected, 'should not call reportError')
			}

			function verify (event, e) {
				assert.strictEqual(e, expected)
				assert.strictEqual(e.value, value)
				return true
			}

			const eh = new ErrorHandler(verify, fail)
			eh.untrack(expected)
		})

		it('should silence error', () => {
			const value = {}
			const expected = fakeError(value)
			function fail (e) {
				assert.fail(e, expected, 'should not call reportError')
			}

			const eh = new ErrorHandler(() => true, fail)
			eh.untrack(expected)

			assert(isHandled(expected))
		})
	})
})
