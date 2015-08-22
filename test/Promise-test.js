import { Promise, fulfill, reject } from '../src/main';
import assert from 'assert';

describe('Promise', () => {
    it('should call resolver synchronously', () => {
        let called = false;
        new Promise((resolve, reject) => called = true);
        assert(called);
    });

    it('should fulfill with value', () => {
        let expected = {};
        return new Promise(resolve => resolve(expected))
            .then(x => assert.strictEqual(expected, x));
    });

    it('should resolve to fulfilled promise', () => {
        let expected = {};
        return new Promise(resolve => resolve(fulfill(expected)))
            .then(x => assert.strictEqual(expected, x));
    });

    it('should resolve to rejected promise', () => {
        let expected = {};
        return new Promise(resolve => resolve(reject(expected)))
            .then(assert.ifError, x => assert.strictEqual(expected, x));
    });

    it('should reject with value', () => {
        let expected = {};
        return new Promise((_, reject) => reject(expected))
            .then(assert.ifError, x => assert.strictEqual(expected, x));
    });

});