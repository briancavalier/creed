import { delay, never, reject, fulfill } from '../src/main';
import { silenceError, isNever, isRejected, isPending, getValue } from '../src/inspect';
import assert from 'assert';

function assertSame(ap, bp) {
    return ap.then(a => bp.then(b => assert(a === b)));
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

    it('should return never for never', () => {
        assert(isNever(delay(0, never())));
    });

    it('should delay value', () => {
        let x = {};
        let t = 10;
        let p = delay(t, x);

        let now = Date.now();
        return assertSame(fulfill(x), p)
            .then(() => assert(Date.now() - now >= t));
    });

    it('should delay fulfilled', () => {
        let x = {};
        let t = 10;
        let p = delay(t, fulfill(x));

        let now = Date.now();
        return assertSame(fulfill(x), p)
            .then(() => assert(Date.now() - now >= t));
    });
});