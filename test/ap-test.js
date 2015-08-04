import { just } from '../src/main';
import assert from 'assert';

function assertSame(ap, bp) {
    return ap.then(a => bp.then(b => assert(a === b)));
}

describe('ap', () => {

    it('should satisfy identity', () => {
        let v = just({});
        return assertSame(just(x => x).ap(v), v);
    });

    it('should satisfy composition', () => {
        let u = just(x => 'u' + x);
        let v = just(x => 'v' + x);
        let w = just('w');

        return assertSame(
            just(f => g => x => f(g(x))).ap(u).ap(v).ap(w),
            u.ap(v.ap(w))
        );
    });

    it('should satisfy homomorphism', () => {
        let f = x => x + 'f';
        let x = 'x';
        return assertSame(just(f).ap(just(x)), just(f(x)));
    });

    it('should satisfy interchange', () => {
        let f = x => x + 'f';
        let u = just(f);
        let y = 'y';

        return assertSame(u.ap(just(y)), just(f => f(y)).ap(u));
    });

});
