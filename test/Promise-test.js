import { Promise, fulfill, reject } from '../src/main';
import test from 'ava';

test('should call resolver synchronously', t => {
    let called = false;
    new Promise((resolve, reject) => called = true);
    t.ok(called);
});

test('should reject if resolver throws synchronously', t => {
    t.plan(1);
    const expected = new Error();
    return new Promise(() => { throw expected; })
        .catch(x => t.is(expected, x));
});

test('should fulfill with value', t => {
    const expected = {};
    return new Promise(resolve => resolve(expected))
        .then(x => t.is(expected, x));
});

test('should resolve to fulfilled promise', t => {
    const expected = {};
    return new Promise(resolve => resolve(fulfill(expected)))
        .then(x => t.is(expected, x));
});

test('should resolve to rejected promise', t => {
    t.plan(1);
    const expected = new Error();
    return new Promise(resolve => resolve(reject(expected)))
        .catch(x => t.is(expected, x));
});

test('should reject with value', t => {
    const expected = new Error();
    return new Promise((_, reject) => reject(expected))
        .catch(x => t.is(expected, x));
});
