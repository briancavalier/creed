import { isFulfilled, isRejected, isSettled, isPending, isHandled, isNever, silenceError, getValue, getReason } from '../src/inspect';
import { resolve, reject, never, Future } from '../src/Promise';
import test from 'ava';

test('isFulfilled should be true for fulfilled promise', t => {
    t.ok(isFulfilled(resolve()));
});

test('isFulfilled should be false for rejected promise', t => {
    const p = reject(new Error());
    silenceError(p);
    t.ok(!isFulfilled(p));
});

test('isFulfilled should be false for pending promise', t => {
    t.ok(!isFulfilled(new Future()));
});

test('isFulfilled should be false for never', t => {
    t.ok(!isFulfilled(never()));
});

test('isRejected should be true for rejected promise', t => {
    const p = reject(new Error);
    silenceError(p);
    t.ok(isRejected(p));
});

test('isRejected should be false for fulfilled promise', t => {
    t.ok(!isRejected(resolve()));
});

test('isRejected should be false for pending promise', t => {
    t.ok(!isRejected(new Future()));
});

test('isRejected should be false for never', t => {
    t.ok(!isRejected(never()));
});

test('isSettled should be true for fulfilled promise', t => {
    t.ok(isSettled(resolve()));
});

test('isSettled should be true for rejected promise', t => {
    const p = reject(new Error);
    silenceError(p);
    t.ok(isSettled(p));
});

test('isSettled should be false for pending promise', t => {
    t.ok(!isSettled(new Future()));
});

test('isSettled should be false for never', t => {
    t.ok(!isSettled(never()));
});

test('isPending should be false for fulfilled promise', t => {
    t.ok(!isPending(resolve()));
});

test('isPending should be false for rejected promise', t => {
    const p = reject(new Error);
    silenceError(p);
    t.ok(!isPending(p));
});

test('isPending should be true for pending promise', t => {
    t.ok(isPending(new Future()));
});

test('isPending should be true for never', t => {
    t.ok(isPending(never()));
});

test('isNever should be false for fulfilled promise', t => {
    t.ok(!isNever(resolve()));
});

test('isNever should be false for rejected promise', t => {
    const p = reject(new Error);
    silenceError(p);
    t.ok(!isNever(p));
});

test('isNever should be false for pending promise', t => {
    t.ok(!isNever(new Future()));
});

test('isNever should be true for never', t => {
    t.ok(isNever(never()));
});

test('isHandled should be false for fulfilled promise', t => {
    t.ok(!isHandled(resolve()));
});

test('isHandled should be false for rejected promise', t => {
    const p = reject(new Error);
    t.ok(!isHandled(p));
    silenceError(p);
});

test.cb('isHandled should be true for handled rejected promise', t => {
    t.plan(1);
    const p = reject();
    p.catch(() => {
        setTimeout((t, p) => {
            t.ok(isHandled(p));
            t.end();
        }, 0, t, p);
    });
});

test('isHandled should be true for silenced rejected promise', t => {
    const p = reject(new Error());
    silenceError(p);
    t.ok(isHandled(p));
});

test('isHandled should be false for pending promise', t => {
    t.ok(!isHandled(new Future()));
});

test('isHandled should be false for never', t => {
    t.ok(!isHandled(never()));
});

test('getValue should get value from fulfilled promise', t => {
    const x = {};
    t.is(x, getValue(resolve(x)));
});

test('getValue should throw for rejected promise', t => {
    const p = reject(new Error);
    silenceError(p);
    t.throws(() => getValue(p));
});

test('getValue should throw for pending promise', t => {
    t.throws(() => getValue(new Future()));
});

test('getValue should throw for never', t => {
    t.throws(() => getValue(never()));
});

test('getReason should handle rejected promise', t => {
    const p = reject(new Error());
    t.ok(!isHandled(p));

    getReason(p);
    t.ok(isHandled(p));
});

test('getReason should get reason from rejected promise', t => {
    const x = new Error();
    const p = reject(x);
    t.is(x, getReason(p));
});

test('getReason should throw for fulfilled promise', t => {
    t.throws(() => getReason(fulfill()));
});

test('getReason should throw for pending promise', t => {
    t.throws(() => getReason(new Future()));
});

test('getReason should throw for never', t => {
    t.throws(() => getReason(never()));
});

test('silenceError should handle rejected promise', t => {
    const p = reject(new Error());
    t.ok(!isHandled(p));

    silenceError(p);
    t.ok(isHandled(p));
});

test('silenceError should be a noop for fulfilled promise', t => {
    const p = resolve();
    t.ok(!isHandled(p));

    silenceError(p);
    t.ok(!isHandled(p));
});
