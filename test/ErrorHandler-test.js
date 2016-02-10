import ErrorHandler from '../src/ErrorHandler';
import test from 'ava';
import { isHandled } from '../src/inspect';
import { HANDLED } from '../src/state';

function fakeError(value) {
    return {
        value: value,
        _state: 0,
        state() { return this._state; },
        _runAction() { this._state |= HANDLED } };
}

test('track should emit event immediately', t => {
    const value = {};
    const expected = fakeError(value);
    function fail() {
        t.fail('should not call reportError');
    }

    function verify(event, e, error) {
        t.is(e, expected);
        t.is(error, value);
        return true;
    }

    const eh = new ErrorHandler(verify, fail);
    eh.track(expected);
});

test.cb('track should report error later', t => {
    t.plan(2);
    const value = {};
    const expected = fakeError(value);
    function verify(e) {
        t.is(e, expected);
        t.is(e.value, value);
        t.end();
    }

    const eh = new ErrorHandler(() => false, verify);
    eh.track(expected);
});

test('untrack should emit event immediately', t => {
    const value = {};
    const expected = fakeError(value);
    function fail() {
        t.fail('should not call reportError');
    }

    function verify(event, e) {
        t.is(e, expected);
        t.is(e.value, value);
        return true;
    }

    const eh = new ErrorHandler(verify, fail);
    eh.untrack(expected);
});

test('untrack should silence error', t => {
    const value = {};
    const expected = fakeError(value);
    function fail() {
        t.fail('should not call reportError');
    }

    const eh = new ErrorHandler(() => true, fail);
    eh.untrack(expected);

    t.is(expected.state(), HANDLED);
});
