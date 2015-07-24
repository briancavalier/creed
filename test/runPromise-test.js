import { runPromise, resolve, reject } from '../src/Promise';
import assert from 'assert';

let fail = x => { throw x; };

describe('runPromise', () => {

    it('should throw synchronously when function not provided', () => {
        assert.throws(runPromise, TypeError);
    });

    it('should reject if resolver throws', () => {
        let x = {};
        return runPromise(fail, x).then(fail, e => {
            assert(x === e);
        });
    });

    it('should reject', () => {
        let x = {};
        return runPromise((_, reject) => {
            reject(x);
        }).then(fail, e => {
            assert(x === e);
        });
    });

    it('should resolve', () => {
        let x = {};
        return runPromise(resolve => {
            resolve(x);
        }).then(a => {
            assert(x === a);
        });
    });

    describe('when rejected explicitly', () => {

        it('should ignore subsequent throw', () => {
            let x = {};
            return runPromise((_, reject) => {
                reject(x);
                throw {};
            }).then(fail, e => {
                assert(x === e);
            });
        });

        it('should ignore subsequent reject', () => {
            let x = {};
            let y = {};
            return runPromise((_, reject) => {
                reject(x);
                reject(y);
            }).then(fail, e => {
                assert(x === e);
            });
        });

        it('should ignore subsequent resolve', () => {
            let x = {};
            return runPromise((_, reject) => {
                reject(x);
                resolve();
            }).then(fail, e => {
                assert(x === e);
            });
        });
    });

    describe('when resolved explicitly', () => {

        it('should ignore subsequent throw', () => {
            let x = {};
            return runPromise(resolve => {
                resolve(x);
                throw {};
            }).then(a => {
                assert(x === a);
            });
        });

        it('should ignore subsequent reject', () => {
            let x = {};
            let y = {};
            return runPromise((resolve, reject) => {
                resolve(x);
                reject(y);
            }).then(a => {
                assert(x === a);
            });
        });

        it('should ignore subsequent resolve', () => {
            let x = {};
            return runPromise(resolve => {
                resolve(x);
                resolve();
            }).then(a => {
                assert(x === a);
            });
        });
    });

    describe('should pass arguments to resolver', () => {
        it('for 1 argument', () => {
            let a = {};
            return runPromise((w, resolve) => {
                assert(w === a);
                resolve();
            }, a);
        });

        it('for 2 arguments', () => {
            let a = {};
            let b = {};
            return runPromise((w, x, resolve) => {
                assert(w === a);
                assert(x === b);
                resolve();
            }, a, b);
        });

        it('for 3 arguments', () => {
            let a = {};
            let b = {};
            let c = {};
            return runPromise((w, x, y, resolve) => {
                assert(w === a);
                assert(x === b);
                assert(y === c);
                resolve();
            }, a, b, c);
        });

        it('for 4 or more arguments', () => {
            let a = {};
            let b = {};
            let c = {};
            let d = {};
            return runPromise((w, x, y, z, resolve) => {
                assert(w === a);
                assert(x === b);
                assert(y === c);
                assert(z === d);
                resolve();
            }, a, b, c, d);
        });
    });
});