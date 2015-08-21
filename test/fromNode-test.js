import { fromNode, all } from '../src/main';
import assert from 'assert';

function makefn() {
    return fromNode((...args) => {
        let last = args.length-1;
        let cb = args[last];
        let a = args.slice(0, last);

        cb(null, a.reduce(append))
    });
}

function append(a, b) {
    return a + b;
}

describe('fromNode', function() {
    it('should fulfill on success', () => {
        let expected = {};
        let f = fromNode((a, cb) => cb(null, a));

        return f(expected).then(x => assert.strictEqual(x, expected));
    });

    it('should reject on failure', () => {
        let expected = new Error();
        let f = fromNode((a, cb) => cb(a));

        return f(expected)
            .then(assert.ifError, e => assert.strictEqual(e, expected));
    });

    it('should accept zero args', () => {
        let f = fromNode((cb) => cb(null, true));

        return f().then(assert);
    });

    it('should accept multiple args', () => {
        let eq = a => b => assert.equal(a, b);
        let a = [];

        a.push(makefn()('a').then(eq('a')));
        a.push(makefn()('a', 'b').then(eq('ab')));
        a.push(makefn()('a', 'b', 'c').then(eq('abc')));
        a.push(makefn()('a', 'b', 'c', 'd').then(eq('abcd')));
        a.push(makefn()('a', 'b', 'c', 'd', 'e').then(eq('abcde')));

        return all(a);
    });
});
