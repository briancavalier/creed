import { fulfill, delay, reject, never } from '../src/main';
import { silenceError } from '../src/inspect';
import { assertSame } from './lib/test-util';
import test from 'ava';

test('should be identity for fulfill', t => {
    const p = fulfill();
    t.is(p, p.concat(fulfill()));
});

test('should be identity for reject', t => {
    const p = reject(new Error());
    silenceError(p);
    t.is(p, p.concat(fulfill()));
});

test('should return other for never', t => {
    const p1 = never();
    const p2 = fulfill();
    t.is(p2, p1.concat(p2));
});

test('should return earlier future', t => {
    const expected = {};
    const p = delay(100).concat(delay(1, expected));
    return assertSame(t, p, fulfill(expected));
});

test('should behave like fulfilled', t => {
    const expected = {};
    const p = fulfill(expected);
    return t.is(delay(10).concat(p), p);
});

test('should behave like rejected', t => {
    const expected = new Error();
    const p = reject(expected);
    silenceError(p);
    return t.is(delay(10).concat(p), p);
});

test('should behave like never', t => {
    const p2 = never();
    const p1 = delay(10);
    return t.is(p1.concat(p2), p1);
});
