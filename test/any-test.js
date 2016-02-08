import { any, resolve, reject } from '../src/main';
import { throwingIterable, arrayIterable } from './lib/test-util';
import test from 'ava';

test('should reject if iterator throws', t => {
    t.plan(1);
    const error = new Error();
    return any(throwingIterable(error))
        .catch(e => t.is(e, error));
});

test('should reject with RangeError for empty iterable', t => {
    t.plan(1);
    return any(new Set()).catch(e => {
        t.ok(e instanceof RangeError);
    });
});

test('should resolve a value', t => {
    const a = [1, 2, 3];
    const s = arrayIterable(a);
    return any(s).then(x => t.ok(a.includes(x)));
});

test('should resolve a promise', t => {
    const a = [1, 2, 3];
    const s = arrayIterable(a.map(resolve));
    return any(s).then(x => t.ok(a.includes(x)));
});

test('should resolve if at least one input resolves', t => {
    const s = arrayIterable([reject(new Error()), reject(new Error()), resolve(3)]);
    return any(s).then(x => t.is(x, 3));
});

test('should reject if all inputs reject', t => {
    t.plan(1);
    const s = arrayIterable([1, 2, 3].map(reject));
    return any(s).catch(() => t.pass());
});
