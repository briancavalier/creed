import { delay } from '../src/main';
import { Future, never, reject, fulfill } from '../src/Promise';
import { silenceError, isNever, isRejected, isPending, getValue } from '../src/inspect';
import { assertSame } from './lib/test-util';
import assert from 'assert';

function lte(a, b) {
    return (a - 1) <= b;
}

describe('delay', function() {

    it('should be identity for 0 ms', () => {
        let p = fulfill();
        assert.strictEqual(p, delay(0, p));
    });

    it('should be identity for rejected', () => {
        let p = reject();
        silenceError(p);
        assert.strictEqual(p, delay(1, p));
    });

    it('should not delay rejected', () => {
        let p = new Future();
        let d = delay(1, p);

        assert(isPending(d));

        let x = {};
        p._reject(x);

        return d.then(assert.ifError, e => assert.strictEqual(x, e));
    });

    it('should return never for never', () => {
        assert(isNever(delay(0, never())));
    });

    it('should delay value', () => {
        let x = {};
        let t = 10;
        let p = delay(t, x);

        let now = Date.now();
        return assertSame(fulfill(x), p)
            .then(() => assert(lte(t, Date.now() - now)));
    });

    it('should delay fulfilled', () => {
        let x = {};
        let t = 10;
        let p = delay(t, fulfill(x));

        let now = Date.now();
        return assertSame(fulfill(x), p)
            .then(() => assert(lte(t, Date.now() - now)));
    });
});