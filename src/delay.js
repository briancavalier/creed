'use strict';

export default function delay(ms, h, deferred) {
    h.asap(new Delay(ms, deferred));
    return deferred;
}

class Delay {
    constructor(time, deferred) {
        this.time = time;
        this.deferred = deferred;
    }

    fulfilled(handler) {
        setTimeout(fulfillDelayed, this.time, handler, this.deferred);
    }

    rejected(handler) {
        this.deferred.become(handler);
        return false;
    }
}

function fulfillDelayed(ref, deferred) {
    deferred.become(ref);
}