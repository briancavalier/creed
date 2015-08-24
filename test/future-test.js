import { future, reject, fulfill, never, Future } from '../src/Promise';
import { silenceError } from '../src/inspect';
import { assertSame } from './lib/test-util';
import assert from 'assert';

const f = x => x+1;
const fp = x => fulfill(x+1);

describe('future', () => {

    it('should return { resolve, promise }', () => {
        let { resolve, promise } = future();
        assert(typeof resolve === 'function');
        assert(promise instanceof Future);
    });

    describe('resolve', () => {
        it('should fulfill promise with value', () => {
            let { resolve, promise } = future();
            let expected = {};
            resolve(expected);
            return promise.then(x => assert.strictEqual(expected, x));
        });

        it('should resolve to fulfilled promise', () => {
            let { resolve, promise } = future();
            let expected = {};
            resolve(fulfill(expected));
            return promise.then(x => assert.strictEqual(expected, x));
        });

        it('should resolve to rejected promise', () => {
            let { resolve, promise } = future();
            let expected = {};
            resolve(reject(expected));
            return promise.then(assert.ifError, x => assert.strictEqual(expected, x));
        });
    });

    describe('when resolved to another promise', () => {

        describe('state', () => {
            it('should have fulfilled state', () => {
                let { resolve, promise } = future();

                var p = fulfill(1);
                resolve(p);
                assert.equal(p.state(), promise.state());
            });

            it('should have rejected state', () => {
                let { resolve, promise } = future();

                var p = reject(1);
                silenceError(p);
                resolve(p);
                assert.equal(p.state(), promise.state());
            });

            it('should have never state', () => {
                let { resolve, promise } = future();

                var p = never();
                resolve(p);
                assert.equal(p.state(), promise.state());
            });
        });

        describe('inspect', () => {
            it('should have fulfilled state', () => {
                let { resolve, promise } = future();

                var p = fulfill(1);
                resolve(p);
                assert.equal(p.inspect(), promise.inspect());
            });

            it('should have rejected state', () => {
                let { resolve, promise } = future();

                var p = reject(1);
                silenceError(p);
                resolve(p);
                assert.equal(p.inspect(), promise.inspect());
            });

            it('should have never state', () => {
                let { resolve, promise } = future();

                var p = never();
                resolve(p);
                assert.equal(p.inspect(), promise.inspect());
            });
        });

        describe('catch', () => {
            it('should behave like fulfilled', () => {
                let { resolve, promise } = future();

                var p = fulfill(1);
                resolve(p);
                assert.strictEqual(p, promise.catch(f));
            });

            it('should have rejected state', () => {
                let { resolve, promise } = future();

                var p = reject(1);
                resolve(p);
                assertSame(p.catch(f), promise.catch(f));
            });

            it('should have never state', () => {
                let { resolve, promise } = future();

                var p = never();
                resolve(p);
                assert.strictEqual(p, promise.catch(f));
            });
        });

        describe('map', () => {
            it('should behave like fulfilled', () => {
                let { resolve, promise } = future();

                var p = fulfill(1);
                resolve(p);
                assertSame(p.map(f), promise.map(f));
            });

            it('should have rejected state', () => {
                let { resolve, promise } = future();

                var p = reject(1);
                silenceError(p);
                resolve(p);
                assert.strictEqual(p, promise.map(f));
            });

            it('should have never state', () => {
                let { resolve, promise } = future();

                var p = never();
                resolve(p);
                assert.strictEqual(p, promise.map(f));
            });
        });

        describe('chain', () => {
            it('should behave like fulfilled', () => {
                let { resolve, promise } = future();

                var p = fulfill(1);
                resolve(p);
                assertSame(p.chain(fp), promise.chain(fp));
            });

            it('should have rejected state', () => {
                let { resolve, promise } = future();

                var p = reject(1);
                silenceError(p);
                resolve(p);
                assert.strictEqual(p, promise.chain(fp));
            });

            it('should have never state', () => {
                let { resolve, promise } = future();

                var p = never();
                resolve(p);
                assert.strictEqual(p, promise.chain(fp));
            });
        });

        describe('ap', () => {
            it('should behave like fulfilled', () => {
                let { resolve, promise } = future();

                var p = fulfill(fp);
                var q = fulfill(1);
                resolve(p);
                assertSame(p.ap(q), promise.ap(q));
            });

            it('should behave like rejected', () => {
                let { resolve, promise } = future();

                var p = reject(fp);
                silenceError(p);
                resolve(p);
                assert.strictEqual(p, promise.ap(fulfill(1)));
            });

            it('should behave like never', () => {
                let { resolve, promise } = future();

                var p = never();
                resolve(p);
                assert.strictEqual(p, promise.ap(fulfill(1)));
            });
        });

        describe('concat', () => {
            it('should behave like fulfilled', () => {
                let { resolve, promise } = future();

                var p1 = fulfill(1);
                var p2 = fulfill(2);

                resolve(p1);
                assertSame(p1.concat(p2), promise.concat(p2));
            });

            it('should behave like rejected', () => {
                let { resolve, promise } = future();

                var p1 = reject(1);
                var p2 = reject(2);
                silenceError(p1);
                silenceError(p2);

                resolve(p1);
                assertSame(p1.concat(p2), promise.concat(p2));
            });

            it('should behave like never', () => {
                let { resolve, promise } = future();

                var p1 = never();
                var p2 = fulfill(2);

                resolve(p1);
                assertSame(p1.concat(p2), promise.concat(p2));
            });

        });
    });

});
