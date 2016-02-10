import { settle, resolve, reject } from '../src/main';
import { isFulfilled, isRejected } from '../src/inspect';
import { throwingIterable } from './lib/test-util';
import test from 'ava';

test('should reject if iterator throws', t => {
    t.plan(1);
    const error = new Error();
    return settle(throwingIterable(error))
        .catch(e => t.is(e, error));
});

test('should settle empty iterable', t => {
    return settle(new Set()).then(a => t.is(a.length, 0));
});

test('should settle promises', t => {
    const s = new Set([1, resolve(2), reject(3)]);
    return settle(s).then(a => {
        t.is(a.length, s.size);
        t.ok(isFulfilled(a[0]));
        t.ok(isFulfilled(a[1]));
        t.ok(isRejected(a[2]));
    });
});
