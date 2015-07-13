'use strict';

import { isPending } from './inspect';
import TimeoutError from './TimeoutError';

export default function(ms, ref, deferred) {
    let timer = setTimeout(rejectOnTimeout, ms, deferred);
    ref.asap(new Timeout(timer, deferred));
    return deferred;
}

class Timeout {
    constructor(timer, deferred) {
        this.timer = timer;
        this.deferred = deferred;
    }

    fulfilled(ref) {
        clearTimeout(this.timer);
        this.deferred.become(ref);
    }

    rejected(ref) {
        clearTimeout(this.timer);
        this.deferred.become(ref);
        return false;
    }
}

function rejectOnTimeout(ref) {
    if(isPending(ref)) {
        ref.reject(new TimeoutError('promise timeout'));
    }
}
