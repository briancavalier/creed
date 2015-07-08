'use strict';

import { isRejected } from './refTypes';

export default function delay(Deferred, ms, h) {
    if (ms <= 0 || isRejected(h)) {
        return h;
    }

    let ref = new Deferred();
    h.asap(new Delay(ms, ref));
    return ref;
}

class Delay {
    constructor(time, ref) {
        this.time = time;
        this.ref = ref;
    }

    fulfilled(handler) {
        setTimeout(fulfillDelayed, this.time, handler, this.ref);
    }

    rejected(handler) {
        this.ref.become(handler);
        return false;
    }
}

function fulfillDelayed(handler, next) {
    next.become(handler);
}