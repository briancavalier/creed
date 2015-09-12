import { fulfill } from '../src/main';
import { assertSame } from './lib/test-util';
import assert from 'assert';

describe('ap', () => {

    it('should satisfy identity', () => {
        let v = fulfill({});
        return assertSame(fulfill(x => x).ap(v), v);
    });

    it('should satisfy composition', () => {
        let u = fulfill(x => 'u' + x);
        let v = fulfill(x => 'v' + x);
        let w = fulfill('w');

        return assertSame(
            fulfill(f => g => x => f(g(x))).ap(u).ap(v).ap(w),
            u.ap(v.ap(w))
        );
    });

    it('should satisfy homomorphism', () => {
        let f = x => x + 'f';
        let x = 'x';
        return assertSame(fulfill(f).ap(fulfill(x)), fulfill(f(x)));
    });

    it('should satisfy interchange', () => {
        let f = x => x + 'f';
        let u = fulfill(f);
        let y = 'y';

        return assertSame(u.ap(fulfill(y)), fulfill(f => f(y)).ap(u));
    });

});
