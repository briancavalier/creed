'use strict';

export default class Race {
    constructor(never) {
        this.never = never;
    }

    valueAt(promise, i, x) {
        promise._fulfill(x);
    }

    fulfillAt(promise, i, ref) {
        promise._become(ref);
    }

    rejectAt(promise, i, ref) {
        promise._become(ref);
    }

    complete(total, promise) {
        if (total === 0) {
            promise._resolve(this.never());
        }
    }
}
