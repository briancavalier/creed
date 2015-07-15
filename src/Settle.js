'use strict';

import { silenceError }from './inspect';

export default class Settle {
    constructor(resolve, results) {
        this.done = false;
        this.pending = 0;
        this.results = results;
        this.resolve = resolve;
    }

    valueAt(promise, i, x) {
        this.settleAt(promise, i, this.resolve(x));
    }

    fulfillAt(promise, i, ref) {
        this.settleAt(promise, i, ref);
    }

    rejectAt(promise, i, ref) {
        silenceError(ref);
        this.settleAt(promise, i, ref);
    }

    settleAt(promise, i, state) {
        this.results[i] = state;
        this.check(this.pending - 1, promise);
    }

    complete(total, promise) {
        this.done = true;
        this.check(this.pending + total, promise);
    }

    check(pending, promise) {
        this.pending = pending;
        if (this.done && pending === 0) {
            promise._fulfill(this.results);
        }
    }
}
