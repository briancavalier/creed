import { fulfill, delay, reject } from '../src/main';
import { assertSame } from './lib/test-util';
import assert from 'assert';

describe('map', function() {

    it('should satisfy identity', () => {
        var u = fulfill({});
        return assertSame(u.map(x => x), u);
    });

    it('should satisfy composition', () => {
        let f = x => x + 'f';
        let g = x => x + 'g';
        let u = fulfill('e');

        return assertSame(u.map(x => f(g(x))), u.map(g).map(f));
    });

    it('should reject if f throws', () => {
        let expected = {};
        return delay(1).map(() => { throw expected; })
            .then(assert.ifError, x => assert.strictEqual(x, expected));
    });

    it('should not map rejection', () => {
        let expected = {};
        return delay(1, expected).then(reject).map(() => null)
            .then(assert.ifError, x => assert.strictEqual(x, expected));
    });
});