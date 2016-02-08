import { Future, resolve } from '../src/Promise';
import { resolveIterable, resultsArray } from '../src/iterable';
import { arrayIterable } from './lib/test-util';
import test from 'ava';

test('should reject if itemHandler throws synchronously before resolution', t => {
    const error = new Error();
    const itemHandler = {
        valueAt() {
            throw error;
        }
    };

    const iterable = arrayIterable([1, 2, 3]);
    return resolveIterable(resolve, itemHandler, iterable, new Future())
        .catch(e => t.is(error, e));
});

test('should not reject if itemHandler throws synchronously after resolution', t => {
    const error = new Error();
    const itemHandler = {
        valueAt() {
            throw error;
        }
    };

    const iterable = arrayIterable([1, 2, 3]);
    const expected = {};
    const promise = new Future();
    promise._resolve(expected);
    return resolveIterable(resolve, itemHandler, iterable, promise)
        .then(x => t.is(expected, x));
});
