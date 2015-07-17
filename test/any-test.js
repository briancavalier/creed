import { any, resolve, reject } from '../src/Promise';
import assert from 'assert';

describe('any', () => {

    it('should reject empty iterable', () => {
        return any(new Set()).catch(() => {
            assert(true);
        });
    });

    it('should resolve a value', () => {
        var s = new Set([1, 2, 3]);
        return any(s).then(x => {
            assert(s.has(x));
        });
    });

    it('should resolve a promise', () => {
        var a = [1, 2, 3];
        var s = new Set(a.map(resolve));
        return any(s).then(x => {
            assert(a.includes(x));
        });
    });

    it('should resolve if at least one input resolves', () => {
        var s = new Set([reject(1), reject(2), resolve(3)]);
        return any(s).then(x => {
            assert.equal(x, 3);
        });
    });

    it('should reject if all inputs reject', () => {
        var s = new Set([1, 2, 3].map(reject));
        return any(s).catch(() => {
            assert(true);
        });
    });

});