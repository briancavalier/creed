import { just, reject } from '../src/main';
import { silenceError } from '../src/inspect';
import assert from 'assert';

describe('just', () => {

    it('should wrap value', () => {
        const x = {};
        return just(x).then(y => assert(x === y));
    });

    it('should wrap promise', () => {
        const x = just({});
        return just(x).then(y => assert(x === y));
    });

    it('should wrap rejected promise', () => {
        const x = reject({});
        silenceError(x);
        return just(x).then(y => assert(x === y));
    });
});
