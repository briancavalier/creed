import { fulfill, reject } from '../src/main';
import { silenceError, getValue } from '../src/inspect';
import assert from 'assert';

describe('reject', () => {

    it('map should be identity', () => {
        var p = reject(true);
        silenceError(p);
        assert.strictEqual(p, p.map(assert.ifError));
    });

    it('ap should be identity', () => {
        var p = reject(assert.ifError);
        silenceError(p);
        assert.strictEqual(p, p.ap(fulfill(true)));
    });

    it('chain should be identity', () => {
        var p = reject();
        silenceError(p);
        assert.strictEqual(p, p.chain(fulfill));
    });
});
