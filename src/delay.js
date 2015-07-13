'use strict';

export default function delay(ms, h, promise) {
    h._runAction(new Delay(ms, promise));
    return promise;
}

class Delay {
    constructor(time, promise) {
        this.time = time;
        this.promise = promise;
    }

    fulfilled(handler) {
        setTimeout(fulfillDelayed, this.time, handler, this.promise);
    }

    rejected(ref) {
        this.promise._become(ref);
        return false;
    }
}

function fulfillDelayed(ref, promise) {
    promise._become(ref);
}