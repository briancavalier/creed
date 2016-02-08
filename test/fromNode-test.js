import { fromNode, all } from '../src/main';
import test from 'ava';

const makefn = () =>
    fromNode((...args) => {
        const last = args.length-1;
        const cb = args[last];
        const a = args.slice(0, last);

        cb(null, a.reduce(append))
    });

const append = (a, b) => a + b;

test('should fulfill on success', t => {
    const expected = {};
    const f = fromNode((a, cb) => cb(null, a));

    return f(expected).then(x => t.is(x, expected));
});

test('should reject on failure', t => {
    t.plan(1);
    const expected = new Error();
    const f = fromNode((a, cb) => cb(a));

    return f(expected).catch(e => t.is(e, expected));
});

test('should reject if function throws synchronously', t => {
    t.plan(1);
    const expected = new Error();
    const f = fromNode((a) => { throw a; });

    return f(expected).then(e => t.is(e, expected));
});

test('should accept zero args', t => {
    const f = fromNode((cb) => cb(null, true));

    return f().then(x => t.ok(x));
});

test('should accept multiple args', t => {
    const eq = a => b => t.is(a, b);
    const a = [];

    a.push(makefn()('a').then(eq('a')));
    a.push(makefn()('a', 'b').then(eq('ab')));
    a.push(makefn()('a', 'b', 'c').then(eq('abc')));
    a.push(makefn()('a', 'b', 'c', 'd').then(eq('abcd')));
    a.push(makefn()('a', 'b', 'c', 'd', 'e').then(eq('abcde')));

    return all(a);
});
