import { Future, all, resolve, reject } from '../src/Promise';
import { fail, throwingIterable, arrayIterable } from './lib/test-util';
import assert from 'assert';

describe('all', () => {

    it('should reject if iterator throws', () => {
        let error = new Error();
        return all(throwingIterable(error))
            .then(fail, e => assert(e === error));
    });

    it('should resolve empty iterable', () => {
        return all([]).then(a => {
            assert.equal(a.length, 0);
        });
    });

    it('should resolve values', () => {
        var expected = [1, 2, 3];
        return all(arrayIterable(expected)).then(a => {
            assert.deepEqual(a, expected);
        });
    });

    it('should resolve promises', () => {
        let p = new Future();
        setTimeout(p => p._resolve(3), 0, p);
        return all(arrayIterable([resolve(1), 2, p])).then(a => {
            assert.deepEqual(a, [1, 2, 3]);
        });
    });

    it('should reject if input contains rejection', () => {
        let p = new Future();
        setTimeout(p => p._reject(2), 0, p);
        return all(arrayIterable([1, p, 3])).catch(x => {
            assert.equal(x, 2);
        });
    });

});