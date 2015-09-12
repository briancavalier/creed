import { fulfill } from '../src/main';
import { assertSame } from './lib/test-util';
import assert from 'assert';

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