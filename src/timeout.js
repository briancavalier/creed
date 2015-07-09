'use strict';

import { isPending, isSettled } from './refTypes';
import TimeoutError from './TimeoutError';

export default function(Deferred, ms, ref) {
    if(isSettled(ref)) {
        return ref;
    }

    let deferred = new Deferred();
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
