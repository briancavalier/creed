import { fulfill, reject } from '../src/main';
import { silenceError, getValue } from '../src/inspect';
import test from 'ava';

test('then should be identity without f', t => {
    const p = reject(true);
    silenceError(p);
    t.is(p, p.then(assert.ifError));
});

test('map should be identity', t => {
    const p = reject(new Error());
    silenceError(p);
    t.is(p, p.map(x => t.fail()));
});

test('ap should be identity', t => {
    const p = reject(x => t.fail());
    silenceError(p);
    t.is(p, p.ap(fulfill()));
});

test('chain should be identity', t => {
    const p = reject(new Error());
    silenceError(p);
    t.is(p, p.chain(fulfill));
});
