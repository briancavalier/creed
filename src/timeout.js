'use strict';

import { isPending, isSettled } from './refTypes';
import TimeoutError from './TimeoutError';

export default function(Deferred, ms, h) {
    if(isSettled(h)) {
        return h;
    }

    let ref = new Deferred();
    let timer = setTimeout(rejectOnTimeout, ms, ref);
    h.when(new Timeout(timer, ref));
    return ref;
}

class Timeout {
    constructor(timer, ref) {
        this.timer = timer;
        this.ref = ref;
    }

    fulfilled(handler) {
        clearTimeout(this.timer);
        this.ref.become(handler);
    }

    rejected(handler) {
        clearTimeout(this.timer);
        this.ref.become(handler);
        return false;
    }
}

function rejectOnTimeout(ref) {
    if(isPending(ref)) {
        ref.reject(new TimeoutError('promise timeout'));
    }
}
