import { timeout, delay } from '../src/main';
import TimeoutError from '../src/TimeoutError';
import { Future, reject, fulfill } from '../src/Promise';
import { silenceError, isNever, isRejected, isPending, getValue } from '../src/inspect';
import { assertSame } from './lib/test-util';
import test from 'ava';

function delayReject(ms, e) {
    const p = new Future();
    setTimeout(e => p._reject(e), ms, e);
    return p;
}

test('should be identity for fulfilled', t => {
    const p = fulfill();
    t.is(p, timeout(0, p));
});

test('should be identity for rejected', t => {
    const p = reject();
    silenceError(p);
    t.is(p, timeout(0, p));
});

test('should reject if timeout is earlier than fulfill', t => {
    t.plan(1);
    return timeout(1, delay(100, true)).catch(e => t.pass());
});

test('should fulfill if timeout is later than fulfill', t => {
    const x = {};
    return timeout(100, delay(1, x)).then(a => t.is(x, a));
});

test('should reject if timeout is earlier than reject', t => {
    t.plan(1);
    const p = delayReject(10, new Error());
    silenceError(p);
    return timeout(1, p)
        .catch(e => t.ok(e instanceof TimeoutError));
});

test('should reject if timeout is later than reject', t => {
    const x = new Error;
    return timeout(10, delayReject(1, x))
        .catch(e => t.is(x, e));
});
