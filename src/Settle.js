'use strict';

import silenceRejection from './silenceRejection';

export default class Settle {
    constructor(stateForValue, results) {
        this.done = false;
        this.pending = 0;
        this.results = results;
        this.stateForValue = stateForValue;
    }

    valueAt(ref, i, x) {
        this.settleAt(ref, i, this.stateForValue(x));
    }

    fulfillAt(ref, i, h) {
        this.settleAt(ref, i, h);
    }

    rejectAt(ref, i, h) {
        silenceRejection(h);
        this.settleAt(ref, i, h);
    }

    settleAt(ref, i, state) {
        this.results[i] = state;
        this.check(this.pending - 1, ref);
    }

    complete(total, ref) {
        this.done = true;
        this.check(this.pending + total, ref);
    }

    check(pending, ref) {
        this.pending = pending;
        if(this.done && pending === 0) {
            ref.fulfill(this.results);
        }
    }
}