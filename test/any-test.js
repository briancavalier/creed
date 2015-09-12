import { any, resolve, reject } from '../src/main';
import { throwingIterable, arrayIterable } from './lib/test-util';
import assert from 'assert';

describe('any', () => {

    it('should reject if iterator throws', () => {
        let error = new Error();
        return any(throwingIterable(error))
            .then(assert.ifError, e => assert(e === error));
    });

    it('should reject with RangeError for empty iterable', () => {
        return any(new Set()).catch(e => {
            assert(e instanceof RangeError);
        });
    });

    it('should resolve a value', () => {
        var a = [1, 2, 3];
        var s = arrayIterable(a);
        return any(s).then(x => {
            assert(a.includes(x));
        });
    });

    it('should resolve a promise', () => {
        var a = [1, 2, 3];
        var s = arrayIterable(a.map(resolve));
        return any(s).then(x => {
            assert(a.includes(x));
        });
    });

    it('should resolve if at least one input resolves', () => {
        var s = arrayIterable([reject(1), reject(2), resolve(3)]);
        return any(s).then(x => {
            assert.equal(x, 3);
        });
    });

    it('should reject if all inputs reject', () => {
        var s = arrayIterable([1, 2, 3].map(reject));
        return any(s).catch(() => {
            assert(true);
        });
    });

});