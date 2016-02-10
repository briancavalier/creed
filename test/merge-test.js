import { Future, merge, resolve, reject } from '../src/main';
import test from 'ava';

test('should call merge function later', t => {
    let ok = false;
    const p = merge(() => t.ok(ok));
    ok = true;

    return p;
});

test('should call merge function with values', t => {
    t.plan(3);
    return merge((x, y) => {
        t.is(x, 1);
        t.is(y, 2);
        return x+y;
    }, 1, 2).then(a => t.is(a, 3));
});

test('should call merge function with fulfilled values', t => {
    t.plan(3);
    return merge((x, y) => {
        t.is(x, 1);
        t.is(y, 2);
        return x+y;
    }, resolve(1), resolve(2)).then(a => t.is(a, 3));
});

test('should reject if input contains rejection', t => {
    const expected = new Error();
    return merge(() => t.fail(), 1, reject(expected))
        .catch(x => t.is(expected, x));
});

test('should reject if merge function throws', t => {
    const expected = new Error();
    return merge(() => { throw expected }, resolve(1), resolve(2))
        .catch(e => t.is(expected, e));
});
