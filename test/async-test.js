import makeAsync from '../src/async';
import assert from 'assert';

describe('makeAsync', () => {
    it('should make a function that invokes later', done => {
        let async = makeAsync(done);
        async();
    });
});