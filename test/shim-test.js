import { shim, Promise } from '../src/main';
import assert from 'assert';

let g = typeof self !== 'undefined' ? self
    : typeof global !== 'undefined' ? global
    : undefined;

describe('shim', () => {
    it('should return pre-existing Promise', () => {
        let prev = g.Promise;
        try {
            assert.strictEqual(shim(), prev);
        } finally {
            g.Promise = prev;
        }
    });

    it('should set creed Promise', () => {
        let prev = void 0;
        try {
            prev = shim();
            assert.strictEqual(Promise, g.Promise);
        } finally {
            g.Promise = prev;
        }
    });
});