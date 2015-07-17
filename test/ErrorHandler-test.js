import ErrorHandler from '../src/ErrorHandler';
import assert from 'assert';
import { isHandled } from '../src/inspect';
import { HANDLED } from '../src/state';

function fakeError(value) {
    return {
        value: value,
        _state: 0,
        state() { return this._state; },
        _runAction() { this._state |= HANDLED } };
}

describe('ErrorHandler', () => {

    describe('track', () => {
        it('should emit event immediately', () => {
            let value = {};
            let expected = fakeError(value);
            function fail(e) {
                assert.fail(e, expected, 'should not call reportError');
            }

            function verify(event, e, error) {
                assert.strictEqual(e, expected);
                assert.strictEqual(error, value);
                return true;
            }

            let eh = new ErrorHandler(verify, fail);
            eh.track(expected);
        });

        it('should report error later', done => {
            let value = {};
            let expected = fakeError(value);
            function verify(e) {
                assert.strictEqual(e, expected);
                assert.strictEqual(e.value, value);
                done();
            }

            let eh = new ErrorHandler(() => false, verify);
            eh.track(expected);
        });
    });

    describe('untrack', () => {
        it('should emit event immediately', () => {
            let value = {};
            let expected = fakeError(value);
            function fail(e) {
                assert.fail(e, expected, 'should not call reportError');
            }

            function verify(event, e) {
                assert.strictEqual(e, expected);
                assert.strictEqual(e.value, value);
                return true;
            }

            let eh = new ErrorHandler(verify, fail);
            eh.untrack(expected);
        });

        it('should silence error', () => {
            let value = {};
            let expected = fakeError(value);
            function fail(e) {
                assert.fail(e, expected, 'should not call reportError');
            }

            let eh = new ErrorHandler(() => true, fail);
            eh.untrack(expected);

            assert.equal(expected.state(), HANDLED);
        });
    });

});
