'use strict';

import silenceRejection from './silenceRejection';

export default class Settle {
    constructor(stateForRef, stateForValue) {
        this.stateForRef = stateForRef;
        this.stateForValue = stateForValue;
    }

    init(promises) {
        let n = Array.isArray(promises) ? promises.length : 0;
        return { done: false, pending: 0, results: new Array(n) };
    }

    valueAt(ref, i, x, state) {
        this.settleAt(ref, i, this.stateForValue(x), state);
    }

    fulfillAt(ref, i, h, state) {
        this.settleAt(ref, i, this.stateForRef(h), state);
    }

    rejectAt(ref, i, h, state) {
        silenceRejection(h);
        this.settleAt(ref, i, this.stateForRef(h), state);
    }

    settleAt(ref, i, s, state) {
        state.results[i] = s;
        --state.pending;
        this.check(ref, state);
    }

    complete(total, ref, state) {
        state.done = true;
        state.pending += total;
        this.check(ref, state);
    }

    check(ref, state) {
        if(state.done && state.pending === 0) {
            ref.fulfill(state.results);
        }
    }
}