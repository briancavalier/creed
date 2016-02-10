import { Future, all, resolve } from '../src/Promise';
import { throwingIterable, arrayIterable } from './lib/test-util';
import test from 'ava';

test('should reject if iterator throws', t => {
    t.plan(1);
    const error = new Error();
    return all(throwingIterable(error))
        .catch(e => t.is(e, error));
});

test('should reject if iterator throws', t => {
    t.plan(1);
    let error = new Error();
    return all(throwingIterable(error))
        .catch(e => t.is(e, error));
});

test('should resolve empty iterable', t => {
    return all([]).then(a => t.is(a.length, 0));
});

test('should resolve values', t => {
    var expected = [1, 2, 3];
    return all(arrayIterable(expected))
        .then(a => t.same(a, expected));
});

test('should resolve promises', t => {
    let p = new Future();
    setTimeout(p => p._resolve(3), 0, p);
    return all(arrayIterable([resolve(1), 2, p]))
        .then(a => t.same(a, [1, 2, 3]));
});

test('should reject if input contains rejection', t => {
    t.plan(1);
    let p = new Future();
    setTimeout(p => p._reject(2), 0, p);
    return all(arrayIterable([1, p, 3]))
        .catch(x => t.same(x, 2));
});

test('should resolve thenables', t => {
    let expected = {};
    let thenable = {
        then(f) {
            f(expected);
        }
    };

    return all(arrayIterable([thenable])).then(a => {
        t.is(expected, a[0]);
        t.is(1, a.length);
    });
});

