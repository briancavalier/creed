import { fulfill, delay, reject } from '../src/main';
import { assertSame } from './lib/test-util';
import test from 'ava';

test('should satisfy identity', t => {
    const u = fulfill({});
    return assertSame(t, u.map(x => x), u);
});

test('should satisfy composition', t => {
    const f = x => x + 'f';
    const g = x => x + 'g';
    const u = fulfill('e');

    return assertSame(t, u.map(x => f(g(x))), u.map(g).map(f));
});

test('should reject if f throws', t => {
    t.plan(1);
    const expected = new Error();
    return delay(1).map(() => { throw expected; })
        .catch(x => t.is(x, expected));
});

test('should not map rejection', t => {
    t.plan(1);
    const expected = new Error();
    return delay(1, expected).then(reject).map(() => null)
        .catch(x => t.is(x, expected));
});
