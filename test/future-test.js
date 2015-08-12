import { future, reject, fulfill, Future } from '../src/Promise';
import { silenceError } from '../src/inspect';
import assert from 'assert';

let fail = x => { throw x; };

describe('future', () => {

    it('should return { resolve, promise }', () => {
        let { resolve, promise } = future();
        assert(typeof resolve === 'function');
        assert(promise instanceof Future);
    });

    describe('resolve', () => {
        it('should fulfill promise with value', () => {
            let { resolve, promise } = future();
            let expected = {};
            resolve(expected);
            return promise.then(x => assert.strictEqual(expected, x));
        });

        it('should resolve to fulfilled promise', () => {
            let { resolve, promise } = future();
            let expected = {};
            resolve(fulfill(expected));
            return promise.then(x => assert.strictEqual(expected, x));
        });

        it('should resolve to rejected promise', () => {
            let { resolve, promise } = future();
            let expected = {};
            resolve(reject(expected));
            return promise.then(fail, x => assert.strictEqual(expected, x));
        });
    });
});
