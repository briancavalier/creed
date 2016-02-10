import { Future } from '../src/Promise';
import { isNever } from '../src/inspect';
import test from 'ava';

test('should return never', t => {
    t.ok(isNever(Future.empty()));
});
