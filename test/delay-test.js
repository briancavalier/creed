import { delay } from '../src/main';
import { Future, never, reject, fulfill } from '../src/Promise';
import { silenceError, isNever, isRejected, isPending, getValue } from '../src/inspect';
import { assertSame } from './lib/test-util';
import test from 'ava';

const lte = (a, b) => (a - 1) <= b;

test('should be identity for 0 ms', t => {
    const p = fulfill();
    t.is(p, delay(0, p));
});

test('should be identity for rejected', t => {
    const p = reject();
    silenceError(p);
    t.is(p, delay(1, p));
});

test('should not delay rejected', t => {
    t.plan(2);
    const p = new Future();
    const d = delay(1, p);

    t.ok(isPending(d));

    const x = new Error();
    p._reject(x);

    return d.catch(e => t.is(x, e));
});

test('should return never for never', t => {
    t.ok(isNever(delay(0, never())));
});

test('should delay value', t => {
    const x = {};
    const dt = 10;
    const p = delay(dt, x);

    const now = Date.now();
    return assertSame(t, fulfill(x), p)
        .then(() => t.ok(lte(dt, Date.now() - now)));
});

test('should delay fulfilled', t => {
    const x = {};
    const dt = 10;
    const p = delay(dt, fulfill(x));

    const now = Date.now();
    return assertSame(t, fulfill(x), p)
        .then(() => t.ok(lte(dt, Date.now() - now)));
});
