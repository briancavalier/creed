import { resolve, reject, Future } from '../src/Promise';
import test from 'ava';

test('should reject promise cycle', t => {
    t.plan(1);
    const p = new Future();
    p._resolve(p);
    return p.catch(e => t.ok(e instanceof TypeError));
});

test('should resolve fulfilled thenable', t => {
    const expected = {};
    return resolve({ then: f => f(expected) })
        .then(x => t.is(expected, x));
});

test('should resolve rejected thenable', t => {
    t.plan(1);
    const expected = new Error();
    return resolve({ then: (f, r) => r(expected) })
        .catch(e => t.is(expected, e));
});

test('should reject if thenable.then throws', t => {
    const expected = new Error();
    return resolve({ then: () => { throw expected } })
        .catch(e => t.is(expected, e));
});

test('should reject if accessing thenable.then throws', t => {
    const expected = new Error();
    const thenable = {
        get then() { throw expected; }
    };

    return resolve(thenable)
        .catch(e => t.is(expected, e));
});
