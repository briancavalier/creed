import { fulfill } from '../src/main';
import { assertSame } from './lib/test-util';
import test from 'ava';

test('should satisfy identity', t => {
    const v = fulfill({});
    return assertSame(t, fulfill(x => x).ap(v), v);
});

test('should satisfy composition', t => {
    const u = fulfill(x => 'u' + x);
    const v = fulfill(x => 'v' + x);
    const w = fulfill('w');

    return assertSame(t,
        fulfill(f => g => x => f(g(x))).ap(u).ap(v).ap(w),
        u.ap(v.ap(w))
    );
});

test('should satisfy homomorphism', t => {
    const f = x => x + 'f';
    const x = 'x';
    return assertSame(t, fulfill(f).ap(fulfill(x)), fulfill(f(x)));
});

test('should satisfy interchange', t => {
    const f = x => x + 'f';
    const u = fulfill(f);
    const y = 'y';

    return assertSame(t, u.ap(fulfill(y)), fulfill(f => f(y)).ap(u));
});
