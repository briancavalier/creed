import TaskQueue from '../src/TaskQueue';
import test from 'ava';

test.cb('should add task to execute later', t => {
    let i = 0;
    function inc() {
        i++;
    }

    function verify() {
        t.is(i, 2);
        t.end();
    }

    const q = new TaskQueue();

    q.add({ run: inc });
    q.add({ run: inc });
    q.add({ run: verify });
});

