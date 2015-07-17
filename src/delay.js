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

    fulfilled(p) {
        setTimeout(fulfillDelayed, this.time, p, this.promise);
    }

    rejected(p) {
        this.promise._become(p);
        return false;
    }
}

function fulfillDelayed(p, promise) {
    promise._become(p);
}
