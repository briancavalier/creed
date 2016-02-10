import { isNode } from '../src/env';
import test from 'ava';

test('isNode should be boolean', t => {
    t.ok(typeof isNode === 'boolean');
});
