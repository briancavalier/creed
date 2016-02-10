import { fulfill, reject } from '../src/main';
import { silenceError, getValue } from '../src/inspect';
import test from 'ava';

test('should wrap value', t => {
    const x = {};
    return fulfill(x).then(y => t.is(x, y));
});

test('should be immediately fulfilled', t => {
    const x = {};
    t.is(x, getValue(fulfill(x)));
});

test('should wrap promise', t => {
    const x = fulfill({});
    return fulfill(x).then(y => t.is(x, y));
});

test('should wrap rejected promise', t => {
    const x = reject(new Error());
    silenceError(x);
    return fulfill(x).then(y => t.is(x, y));
});

test('catch should be identity', t => {
    const p = fulfill(true);
    t.is(p, p.catch(e => t.fail(e)));
});

test('then should be identity when typeof f !== function', t => {
    const p = fulfill();
    t.is(p, p.then());
});
