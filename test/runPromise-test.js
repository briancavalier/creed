import { runPromise, resolve, reject } from '../src/main';
import test from 'ava';

const fail = x => { throw x; };

test('should throw synchronously when function not provided', t => {
    t.throws(runPromise, TypeError);
});

test('should reject if resolver throws', t => {
    t.plan(1);
    const x = {};
    return runPromise(fail, x).catch(e => t.is(x, e));
});

test('should reject', t => {
    const x = new Error();
    return runPromise((_, reject) => reject(x))
        .catch(e => t.is(x, e));
});

test('should resolve', t => {
    const x = {};
    return runPromise(resolve => resolve(x))
        .catch(a => t.is(x, a));
});

test('when rejected should ignore subsequent throw', t => {
    const x = new Error();
    return runPromise((_, reject) => {
        reject(x);
        throw new Error();
    }).catch(e => t.is(x, e));
});

test('when rejected should ignore subsequent reject', t => {
    const x = new Error();
    const y = new Error();
    return runPromise((_, reject) => {
        reject(x);
        reject(y);
    }).catch(e => t.is(x, e));
});

test('when rejected should ignore subsequent resolve', t => {
    const x = new Error();
    return runPromise((resolve, reject) => {
        reject(x);
        resolve();
    }).then(e => t.is(x, e));
});

test('when resolved should ignore subsequent throw', t => {
    const x = {};
    return runPromise(resolve => {
        resolve(x);
        throw new Error();
    }).then(a => t.is(x, a));
});

test('when resolved should ignore subsequent reject', t => {
    const x = {};
    return runPromise((resolve, reject) => {
        resolve(x);
        reject(new Error());
    }).then(a => t.is(x, a));
});

test('when resolved should ignore subsequent resolve', t => {
    const x = {};
    return runPromise(resolve => {
        resolve(x);
        resolve();
    }).then(a => t.is(x, a));
});

test('should pass 1 argument', t => {
    const a = {};
    return runPromise((w, resolve) => {
        t.is(w, a);
        resolve();
    }, a);
});

test('should pass 2 arguments', t => {
    const a = {};
    const b = {};
    return runPromise((x, y, resolve) => {
        t.is(x, a);
        t.is(y, b);
        resolve();
    }, a, b);
});

test('should pass 3 arguments', t => {
    const a = {};
    const b = {};
    const c = {};
    return runPromise((x, y, z, resolve) => {
        t.is(x, a);
        t.is(y, b);
        t.is(z, c);
        resolve();
    }, a, b, c);
});

test('should pass 4 or more arguments', t => {
    const a = {};
    const b = {};
    const c = {};
    const d = {};
    return runPromise((w, x, y, z, resolve) => {
        t.is(w, a);
        t.is(x, b);
        t.is(y, c);
        t.is(z, d);
        resolve();
    }, a, b, c, d);
});
