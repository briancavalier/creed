import makeAsync from '../src/async';
import test from 'ava';

test.cb('should make a function that invokes later', t => {
    t.plan(1);
    const async = makeAsync(() => {
        t.pass();
        t.end();
    });
    async();
});
