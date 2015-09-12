import { Future, reject } from '../src/Promise';
import { silenceError, getValue } from '../src/inspect';
import assert from 'assert';

describe('fulfill', () => {

    it('should wrap value', () => {
        const x = {};
        return Future.of(x).then(y => assert(x === y));
    });

    it('should be immediately fulfilled', () => {
        let x = {};
        assert.strictEqual(x, getValue(Future.of(x)));
    });

    it('should wrap promise', () => {
        const x = Future.of({});
        return Future.of(x).then(y => assert(x === y));
    });

    it('should wrap rejected promise', () => {
        const x = reject({});
        silenceError(x);
        return Future.of(x).then(y => assert(x === y));
    });
});
