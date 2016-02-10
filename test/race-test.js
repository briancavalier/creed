import { race, resolve, reject, never } from '../src/main';
import { isNever } from '../src/inspect';
import { throwingIterable } from './lib/test-util';
import test from 'ava';

test('should reject if iterator throws', t => {
    t.plan(1);
    const error = new Error();
    return race(throwingIterable(error))
        .catch(e => t.is(e, error));
});

test('should return never when input is empty', t => {
    t.ok(isNever(race([])));
});

test('should reject with a TypeError when passed non-iterable', t => {
    t.plan(1);
    return race(123).catch(e => t.ok(e instanceof TypeError));
});

test('should be identity for 1 element when value', t => {
    return race(new Set([1])).then(x => t.is(x, 1));
});

test('should be identity for 1 element when fulfilled', t => {
    return race(new Set([resolve(1)])).then(x => t.is(x, 1));
});

test('should be identity for 1 element when rejected', t => {
    t.plan(1);
    const expected = new Error();
    return race(new Set([reject(expected)]))
        .catch(e => t.is(expected, e));
});

test('should fulfill when winner fulfills', t => {
    return race([resolve(), never()])
});

test('should reject when winner rejects', t => {
    t.plan(1);
    const expected = new Error();
    return race([reject(expected), never()])
        .catch(e => t.is(expected, e));
});
