import { fulfill } from '../src/main';
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

});