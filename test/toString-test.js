import { fulfill, reject, Future, never } from '../src/Promise';
import { silenceError, getValue, getReason } from '../src/inspect';
import test from 'ava';

test('should indicate fulfilled promise', t => {
    const p = fulfill('a');
    t.is(`[object Promise { fulfilled: ${getValue(p)} }]`,
        p.toString());
});

test('should indicate rejected promise', t => {
    const p = reject(new Error('a'));
    silenceError(p);
    t.is(`[object Promise { rejected: ${getReason(p)} }]`,
        p.toString());
});

test('should indicate pending promise', t => {
    const p = new Future();
    t.is('[object Promise { pending }]', p.toString());
});

test('should indicate never', t => {
    const p = never();
    t.is('[object Promise { never }]', p.toString());
});
