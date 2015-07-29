import { Future, merge, resolve, reject } from '../src/main';
import assert from 'assert';

describe('merge', () => {

    it('should call merge function later', () => {
        let ok = false;
        let p = merge(() => assert(ok));
        ok = true;

        return p;
    });

    it('should call merge function with values', () => {
        return merge((x, y) => {
            assert.equal(x, 1);
            assert.equal(y, 2);
            return x+y;
        }, 1, 2).then(a => {
            assert.equal(a, 3);
        });
    });

    it('should call merge function with fulfilled values', () => {
        return merge((x, y) => {
            assert.equal(x, 1);
            assert.equal(y, 2);
            return x+y;
        }, resolve(1), resolve(2)).then(a => {
            assert.equal(a, 3);
        });
    });

    it('should reject if input contains rejection', () => {
        return merge((x, y) => {
            assert(false);
        }, 1, reject(2)).catch(x => {
            assert.equal(x, 2);
        });
    });

});