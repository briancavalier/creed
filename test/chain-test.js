import { just } from '../src/main';
import assert from 'assert';

function assertSame(ap, bp) {
    return ap.then(a => bp.then(b => assert(a === b)));
}

describe('chain', function() {

    it('should satisfy associativity', () => {
        let f = x => just(x + 'f');
        let g = x => just(x + 'g');

        var m = just('m');

        return assertSame(
            m.chain(x => f(x).chain(g)),
            m.chain(f).chain(g)
        );
    });

});