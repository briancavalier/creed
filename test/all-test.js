import { Promise, all, resolve, reject } from '../src/Promise';
import assert from 'assert';

describe('all', () => {

    it('should resolve empty iterable', () => {
        return all([]).then(a => {
            assert.equal(a.length, 0);
        });
    });

    it('should resolve values', () => {
        return all(new Set([1, 2, 3])).then(a => {
            assert.deepEqual(a.sort(), [1, 2, 3]);
        });
    });

    it('should resolve promises', () => {
        let p = new Promise();
        setTimeout(p => p._resolve(3), 0, p);
        return all(new Set([resolve(1), 2, p])).then(a => {
            assert.deepEqual(a.sort(), [1, 2, 3]);
        });
    });

    it('should reject if input contains rejection', () => {
        let p = new Promise();
        setTimeout(p => p._reject(2), 0, p);
        return all(new Set([1, p, 3])).catch(x => {
            assert.equal(x, 2);
        });
    });

});