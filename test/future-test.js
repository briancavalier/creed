import { future, reject, fulfill, never, Future } from '../src/Promise';
import { silenceError } from '../src/inspect';
import { assertSame } from './lib/test-util';
import test from 'ava';

const f = x => x+1;
const fp = x => fulfill(x+1);

test('should return { resolve, promise }', t => {
    const { resolve, promise } = future();
    t.ok(typeof resolve === 'function');
    t.ok(promise instanceof Future);
});

test('then should add handlers', t => {
    const { resolve, promise } = future();
    assertSame(t, promise.then(f), promise.then(fp));
    setTimeout(resolve, 0, 1);
    return promise;
});

test('resolve should fulfill promise with value', t => {
    const { resolve, promise } = future();
    const expected = {};
    resolve(expected);
    return promise.then(x => t.is(expected, x));
});

test('resolve should resolve to fulfilled promise', t => {
    const { resolve, promise } = future();
    const expected = {};
    resolve(fulfill(expected));
    return promise.then(x => t.is(expected, x));
});

test('resolve should resolve to rejected promise', t => {
    t.plan(1);
    const { resolve, promise } = future();
    const expected = new Error();
    const p = reject(expected);
    silenceError(p);
    resolve(p);
    return promise.catch(x => t.is(expected, x));
});

test('state should have fulfilled state', t => {
    const { resolve, promise } = future();

    const p = fulfill(1);
    resolve(p);
    t.is(p.state(), promise.state());
});

test('state should have rejected state', t => {
    const { resolve, promise } = future();

    const p = reject(new Error());
    silenceError(p);
    resolve(p);
    t.is(p.state(), promise.state());
});

test('state should have never state', t => {
    const { resolve, promise } = future();

    const p = never();
    resolve(p);
    t.is(p.state(), promise.state());
});

test('inspect should have fulfilled state', t => {
    const { resolve, promise } = future();

    const p = fulfill(1);
    resolve(p);
    t.is(p.inspect(), promise.inspect());
});

test('inspect should have rejected state', t => {
    const { resolve, promise } = future();

    const p = reject(new Error());
    silenceError(p);
    resolve(p);

    t.is(p.inspect(), promise.inspect());
});

test('inspect should have never state', t => {
    const { resolve, promise } = future();

    const p = never();
    resolve(p);
    t.is(p.inspect(), promise.inspect());
});

test('catch should behave like fulfilled', t => {
    const { resolve, promise } = future();

    const p = fulfill(1);
    resolve(p);
    t.is(p, promise.catch(f));
});

test('catch should have rejected state', t => {
    const { resolve, promise } = future();

    const p = reject(1);
    silenceError(p);
    resolve(p);
    assertSame(t, p.catch(f), promise.catch(f));
});

test('catch should have never state', t => {
    const { resolve, promise } = future();

    const p = never();
    resolve(p);
    t.is(p, promise.catch(f));
});

test('map should behave like fulfilled', t => {
    const { resolve, promise } = future();

    const p = fulfill(1);
    resolve(p);
    assertSame(t, p.map(f), promise.map(f));
});

test('map should have rejected state', t => {
    const { resolve, promise } = future();

    const p = reject(new Error());
    silenceError(p);
    resolve(p);
    t.is(p, promise.map(f));
});

test('map should have never state', t => {
    const { resolve, promise } = future();

    const p = never();
    resolve(p);
    t.is(p, promise.map(f));
});

test('chain should behave like fulfilled', t => {
    const { resolve, promise } = future();

    const p = fulfill(1);
    resolve(p);
    assertSame(t, p.chain(fp), promise.chain(fp));
});

test('chain should have rejected state', t => {
    const { resolve, promise } = future();

    const p = reject(new Error());
    silenceError(p);
    resolve(p);
    t.is(p, promise.chain(fp));
});

test('chain should have never state', t => {
    const { resolve, promise } = future();

    const p = never();
    resolve(p);
    t.is(p, promise.chain(fp));
});

test('ap should behave like fulfilled', t => {
    const { resolve, promise } = future();

    const p = fulfill(f);
    const q = fulfill(1);
    resolve(p);
    assertSame(t, p.ap(q), promise.ap(q));
});

test('ap should behave like rejected', t => {
    const { resolve, promise } = future();

    const p = reject(f);
    silenceError(p);
    resolve(p);
    t.is(p, promise.ap(fulfill(1)));
});

test('ap should behave like never', t => {
    const { resolve, promise } = future();

    const p = never();
    resolve(p);
    t.is(p, promise.ap(fulfill(1)));
});

test('concat should behave like fulfilled', t => {
    const { resolve, promise } = future();

    const p1 = fulfill(1);
    const p2 = fulfill(2);

    resolve(p1);
    assertSame(t, p1.concat(p2), promise.concat(p2));
});

test('concat should behave like rejected', t => {
    const { resolve, promise } = future();

    const p1 = reject(new Error());
    const p2 = reject(new Error());
    silenceError(p1);
    silenceError(p2);

    resolve(p1);
    assertSame(t, p1.concat(p2), promise.concat(p2));
});

test('concat should behave like never', t => {
    const { resolve, promise } = future();

    const p1 = never();
    const p2 = fulfill(2);

    resolve(p1);
    assertSame(t, p1.concat(p2), promise.concat(p2));
});
