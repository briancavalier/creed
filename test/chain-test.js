import { fulfill } from '../src/main';
import assert from 'assert';

function assertSame(ap, bp) {
    return ap.then(a => bp.then(b => assert(a === b)));
}

describe('chain', function() {

    it('should satisfy associativity', () => {
        let f = x => fulfill(x + 'f');
        let g = x => fulfill(x + 'g');

        var m = fulfill('m');

        return assertSame(
            m.chain(x => f(x).chain(g)),
            m.chain(f).chain(g)
        );
    });

});