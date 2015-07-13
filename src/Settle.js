'use strict';

import { silenceError }from './inspect';

export default class Settle {
    constructor(stateForValue, results) {
        this.done = false;
        this.pending = 0;
        this.results = results;
        this.stateForValue = stateForValue;
    }

    valueAt(deferred, i, x) {
        this.settleAt(deferred, i, this.stateForValue(x));
    }

    fulfillAt(deferred, i, ref) {
        this.settleAt(deferred, i, ref);
    }

    rejectAt(deferred, i, ref) {
        silenceError(ref);
        this.settleAt(deferred, i, ref);
    }

    settleAt(deferred, i, state) {
        this.results[i] = state;
        this.check(this.pending - 1, deferred);
    }

    complete(total, deferred) {
        this.done = true;
        this.check(this.pending + total, deferred);
    }

    check(pending, deferred) {
        this.pending = pending;
        if(this.done && pending === 0) {
            deferred.fulfill(this.results);
        }
    }
}