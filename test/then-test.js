import { fulfill, reject } from '../src/main';
import { assertSame } from './lib/test-util';
import test from 'ava';

test('should not change value when f is not a function', t => {
    const expected = {};
    return fulfill(expected).then()
        .then(x => t.is(x, expected));
});

test('should not change reason when r is not a function', t => {
    t.plan(1);
    const expected = {};
    return fulfill(expected).then(reject).then(x => null)
        .catch(x => t.is(x, expected));
});

test('should reject if f throws', t => {
    t.plan(1);
    const expected = new Error();
    return fulfill().then(() => { throw expected; })
        .catch(x => t.is(x, expected));
});

test('should reject if r throws', t => {
    t.plan(1);
    const expected = new Error();
    return fulfill().then(reject).catch(() => { throw expected; })
        .then(x => t.is(x, expected));
});
