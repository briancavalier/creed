import { shim, Promise } from '../src/main';
import test from 'ava';

/* global self, global */
let g = typeof self !== 'undefined' ? self
    : typeof global !== 'undefined' ? global
    : undefined;

test('should return pre-existing Promise', t => {
    const prev = g.Promise;
    try {
        t.is(shim(), prev);
    } finally {
        g.Promise = prev;
    }
});

test('should set creed Promise', t => {
    let prev = void 0;
    try {
        prev = shim();
        t.is(Promise, g.Promise);
    } finally {
        g.Promise = prev;
    }
});
