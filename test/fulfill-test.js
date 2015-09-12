import { fulfill, reject } from '../src/main';
import { silenceError, getValue } from '../src/inspect';
import assert from 'assert';

describe('fulfill', () => {

    it('should wrap value', () => {
        const x = {};
        return fulfill(x).then(y => assert(x === y));
    });

    it('should be immediately fulfilled', () => {
        let x = {};
        assert.strictEqual(x, getValue(fulfill(x)));
    });

    it('should wrap promise', () => {
        const x = fulfill({});
        return fulfill(x).then(y => assert(x === y));
    });

    it('should wrap rejected promise', () => {
        const x = reject({});
        silenceError(x);
        return fulfill(x).then(y => assert(x === y));
    });

    it('catch should be identity', () => {
        var p = fulfill(true);
        assert.strictEqual(p, p.catch(assert.ifError));
    });

    it('then should be identity when typeof f !== function', () => {
        var p = fulfill(true);
        assert.strictEqual(p, p.then());
    });
});
