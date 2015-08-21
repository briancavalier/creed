import { never, fulfill } from '../src/main';
import { silenceError, getValue } from '../src/inspect';
import assert from 'assert';

describe('never', () => {

    it('then should be identity', () => {
        var p = never();
        assert.strictEqual(p, p.then(assert.ifError, assert.ifError));
    });

    it('catch should be identity', () => {
        var p = never();
        assert.strictEqual(p, p.catch(assert.ifError));
    });

    it('map should be identity', () => {
        var p = never();
        assert.strictEqual(p, p.map(assert.ifError));
    });

    it('ap should be identity', () => {
        var p = never();
        assert.strictEqual(p, p.ap(fulfill()));
    });

    it('chain should be identity', () => {
        var p = never();
        assert.strictEqual(p, p.chain(fulfill));
    });
});
