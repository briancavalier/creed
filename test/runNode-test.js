import { runNode, all } from '../src/main';
import test from 'ava';

function runFn(...args) {
    return runNode((...args) => {
        const last = args.length-1;
        const cb = args[last];
        const a = args.slice(0, last);

        cb(null, a.reduce(append))
    }, ...args);
}

function append(a, b) {
    return a + b;
}

test('should fulfill on success', t => {
    const expected = {};
    return runNode((a, cb) => cb(null, a), expected)
        .then(x => t.is(x, expected));
});

test('should reject on failure', t => {
    const expected = new Error();
    return runNode((a, cb) => cb(a), expected)
        .catch(e => t.is(e, expected));
});

test('should reject if function throws synchronously', t => {
    const expected = new Error();
    return runNode((a) => { throw a; }, expected)
        .catch(e => t.is(e, expected));
});

test('should accept zero args', t => {
    return runNode((cb) => cb(null, true)).then(x => t.pass());
});

test('should accept multiple args', t => {
    const eq = a => b => t.is(a, b);
    const a = [];

    a.push(runFn('a').then(eq('a')));
    a.push(runFn('a', 'b').then(eq('ab')));
    a.push(runFn('a', 'b', 'c').then(eq('abc')));
    a.push(runFn('a', 'b', 'c', 'd').then(eq('abcd')));
    a.push(runFn('a', 'b', 'c', 'd', 'e').then(eq('abcde')));

    return all(a);
});
