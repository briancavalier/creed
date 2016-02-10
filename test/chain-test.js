import { fulfill, reject, delay } from '../src/main';
import { silenceError } from '../src/inspect';
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
    });

    it('should not map rejection', () => {
        let expected = {};
        return delay(1, expected).then(reject).chain(() => null)
            .then(assert.ifError, x => assert.strictEqual(x, expected));
    });
});
