import { never, fulfill } from '../src/main';
import { silenceError, getValue } from '../src/inspect';
import test from 'ava';

const fail = t => x => t.fail(x);

test('then should be identity', t => {
    const p = never();
    t.is(p, p.then(fail(t), fail(t)));
});

test('catch should be identity', t => {
    const p = never();
    t.is(p, p.catch(fail(t)));
});

test('map should be identity', t => {
    const p = never();
    t.is(p, p.map(fail(t)));
});

test('ap should be identity', t => {
    const p = never();
    t.is(p, p.ap(fulfill()));
});

test('chain should be identity', t => {
    const p = never();
    t.is(p, p.chain(fulfill));
});

test('_when should not call action', t => {
    const fail = () => { throw new Error('never._when called action'); };
    const action = {
        fulfilled: fail,
        rejected: fail
    };

    t.is(undefined, never()._when(action));
});
