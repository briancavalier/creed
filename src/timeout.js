'use strict';

import { isPending } from './inspect';
import TimeoutError from './TimeoutError';

export default function (ms, ref, promise) {
    let timer = setTimeout(rejectOnTimeout, ms, promise);
    ref._runAction(new Timeout(timer, promise));
    return promise;
}

class Timeout {
    constructor(timer, promise) {
        this.timer = timer;
        this.promise = promise;
    }

    fulfilled(ref) {
        clearTimeout(this.timer);
        this.promise._become(ref);
    }

    rejected(ref) {
        clearTimeout(this.timer);
        this.promise._become(ref);
        return false;
    }
}

function rejectOnTimeout(promise) {
    if (isPending(promise)) {
        promise._reject(new TimeoutError('promise timeout'));
    }
}
