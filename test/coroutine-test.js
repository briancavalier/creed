import { fulfill, reject, delay, coroutine } from '../src/main';
import test from 'ava';

test('should allow parameters', t => {
    const f = coroutine(function*(a, b) {
        t.is(a, 'a');
        t.is(b, 'b');
    });

    return f('a', 'b');
});

test('should continue on fulfilled promises', t => {
    const f = coroutine(function*(a, b) {
        return (yield delay(1, a)) + (yield fulfill(b));
    });

    return f('a', 'b').then(x => t.is(x, 'ab'));
});

test('should throw on rejected promises', t => {
    const expected = new Error();
    const f = coroutine(function*(a) {
        try {
            yield reject(a);
        } catch(e) {
            return e;
        }
    });

    return f(expected).then(x => t.is(x, expected));
});

test('should reject on uncaught exception', t => {
    const expected = new Error();
    const f = coroutine(function*(a) {
        yield reject(a);
    });

    return f(expected).catch(e => t.is(e, expected));
});
