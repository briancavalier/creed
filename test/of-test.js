import { Future, reject } from '../src/Promise';
import { silenceError, getValue } from '../src/inspect';
import test from 'ava';

test('should wrap value', t => {
    const x = {};
    return Future.of(x).then(y => t.is(x, y));
});

test('should be immediately fulfilled', t => {
    const x = {};
    t.is(x, getValue(Future.of(x)));
});

test('should wrap promise', t => {
    const x = Future.of({});
    return Future.of(x).then(y => t.is(x, y));
});

test('should wrap rejected promise', t => {
    const x = reject(new Error());
    silenceError(x);
    return Future.of(x).then(y => t.is(x, y));
});
