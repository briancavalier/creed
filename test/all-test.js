import { all, resolve, reject } from '../src/Promise';
import assert from 'assert';

describe('all', () => {

    it('should resolve empty iterable', () => {
        return all(new Set()).then(a => {
            assert.equal(a.length, 0);
        });
    });

    it('should resolve values', () => {
        return all(new Set([1, 2, 3])).then(a => {
            assert.deepEqual(a.sort(), [1, 2, 3]);
        });
    });

    it('should resolve promises', () => {
        return all(new Set([1, 2, 3].map(resolve))).then(a => {
            assert.deepEqual(a.sort(), [1, 2, 3]);
        });
    });

    it('should reject if input contains rejection', () => {
        return all(new Set([1, reject(2), 3])).catch(x => {
            assert.equal(x, 2);
        });
    });

});