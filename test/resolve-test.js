import { resolve, reject, Future } from '../src/Promise';
import assert from 'assert';

describe('resolve', () => {

    it('should reject promise cycle', () => {
        let p = new Future();
        p._resolve(p);
        return p.then(assert.ifError, e => assert(e instanceof TypeError));
    });

    describe('thenables', () => {
        it('should resolve fulfilled thenable', () => {
            let expected = {};
            return resolve({ then: f => f(expected) })
                .then(x => assert.strictEqual(expected, x));
        });

        it('should resolve rejected thenable', () => {
            let expected = {};
            return resolve({ then: (f, r) => r(expected) })
                .then(assert.ifError, e => assert.strictEqual(expected, e));
        });

        it('should reject if thenable.then throws', () => {
            let expected = {};
            return resolve({ then: () => { throw expected } })
                .then(assert.ifError, e => assert.strictEqual(expected, e));
        });

        it('should reject if accessing thenable.then throws', () => {
            let expected = {};
            let thenable = {
                get then() { throw expected; }
            };

            return resolve(thenable)
                .then(assert.ifError, e => assert.strictEqual(expected, e));
        });
    });
});
