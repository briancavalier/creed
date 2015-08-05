import { just } from '../src/main';
import assert from 'assert';

function assertSame(ap, bp) {
    return ap.then(a => bp.then(b => assert(a === b)));
}

describe('map', function() {

    it('should satisfy identity', () => {
        var u = just({});
        return assertSame(u.map(x => x), u);
    });

    it('should satisfy composition', () => {
        let f = x => x + 'f';
        let g = x => x + 'g';
        let u = just('e');

        return assertSame(u.map(x => f(g(x))), u.map(g).map(f));
    });

});