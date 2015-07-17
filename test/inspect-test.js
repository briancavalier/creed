import { isFulfilled, isRejected, isSettled, isPending, isHandled, isNever, silenceError  } from '../src/inspect';
import { resolve, reject, never, Promise } from '../src/Promise';
import assert from 'assert';

describe('inspect', () => {

    describe('isFulfilled', () => {

        it('should be true for fulfilled promise', () => {
            assert(isFulfilled(resolve()));
        });

        it('should be false for rejected promise', () => {
            assert(!isFulfilled(reject()));
        });

        it('should be false for pending promise', () => {
            assert(!isFulfilled(new Promise()));
        });

        it('should be false for never', () => {
            assert(!isFulfilled(never()));
        });

    });

    describe('isRejected', () => {

        it('should be true for rejected promise', () => {
            assert(isRejected(reject()));
        });

        it('should be false for fulfilled promise', () => {
            assert(!isRejected(resolve()));
        });

        it('should be false for pending promise', () => {
            assert(!isRejected(new Promise()));
        });

        it('should be false for never', () => {
            assert(!isRejected(never()));
        });

    });

    describe('isSettled', () => {

        it('should be true for fulfilled promise', () => {
            assert(isSettled(resolve()));
        });

        it('should be true for rejected promise', () => {
            assert(isSettled(reject()));
        });

        it('should be false for pending promise', () => {
            assert(!isSettled(new Promise()));
        });

        it('should be false for never', () => {
            assert(!isSettled(never()));
        });

    });

    describe('isPending', () => {

        it('should be false for fulfilled promise', () => {
            assert(!isPending(resolve()));
        });

        it('should be false for rejected promise', () => {
            assert(!isPending(reject()));
        });

        it('should be true for pending promise', () => {
            assert(isPending(new Promise()));
        });

        it('should be true for never', () => {
            assert(isPending(never()));
        });

    });

    describe('isNever', () => {

        it('should be false for fulfilled promise', () => {
            assert(!isNever(resolve()));
        });

        it('should be false for rejected promise', () => {
            assert(!isNever(reject()));
        });

        it('should be false for pending promise', () => {
            assert(!isNever(new Promise()));
        });

        it('should be true for never', () => {
            assert(isNever(never()));
        });

    });

    describe('isHandled', () => {

        it('should be false for fulfilled promise', () => {
            assert(!isHandled(resolve()));
        });

        it('should be false for rejected promise', () => {
            assert(!isHandled(reject()));
        });

        it('should be true for handled rejected promise', done => {
            let p = reject();
            p.catch(() => {
                setTimeout((done, p) => {
                    assert(isHandled(p));
                    done();
                }, 0, done, p);
            });
        });

        it('should be true for silenced rejected promise', () => {
            var p = reject();
            silenceError(p);
            assert(isHandled(p));
        });

        it('should be false for pending promise', () => {
            assert(!isHandled(new Promise()));
        });

        it('should be false for never', () => {
            assert(!isHandled(never()));
        });

    });

    describe('silenceError', () => {

        it('should handle rejected promise', () => {
            let p = reject();
            assert(!isHandled(p));
            
            silenceError(p);
            assert(isHandled(p));
        });

        it('should be a noop for fulfilled promise', () => {
            let p = resolve();
            assert(!isHandled(p));

            silenceError(p);
            assert(!isHandled(p));
        });
    });
});