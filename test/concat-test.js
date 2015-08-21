import { fulfill, delay, reject, never } from '../src/main';
import { silenceError } from '../src/inspect';
import { assertSame } from './lib/test-util';
import assert from 'assert';

describe('concat', function() {

    it('should be identity for fulfill', () => {
        let p = fulfill();
        assert.strictEqual(p, p.concat(fulfill()));
    });

    it('should be identity for reject', () => {
        let p = reject();
        silenceError(p);
        assert.strictEqual(p, p.concat(fulfill()));
    });

    it('should return other for never', () => {
        let p1 = never();
        let p2 = fulfill();
        assert.strictEqual(p2, p1.concat(p2));
    });

    it('should return earlier future', () => {
        let expected = {};
        var p = delay(2).concat(delay(1, expected));
        return assertSame(p, fulfill(expected));
    })
});