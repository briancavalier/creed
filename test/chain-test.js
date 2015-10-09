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

    it('should reject if f returns a non-promise', () => {
        return fulfill(1).chain(x => x)
            .then(
                () => { throw new Error('should not fulfill'); },
                e => assert(e instanceof TypeError)
            );
    })

});
