'use strict';

import { isPending } from './refTypes.js';

export default class Merge {
    constructor(mergeHandler) {
        this.mergeHandler = mergeHandler;
    }

    init(promises) {
        let n = Array.isArray(promises) ? promises.length : 0;
        return { done: false, pending: 0, results: new Array(n) };
    }

    valueAt(ref, i, x, state) {
        state.results[i] = x;
        --state.pending;
        this.check(ref, state);
    }

    fulfillAt(ref, i, h, state) {
        this.valueAt(ref, i, h.value, state);
    }

    rejectAt(ref, i, h, state) {
        ref.become(h);
    }

    complete(total, ref, state) {
        state.done = true;
        state.pending += total;
        this.check(ref, state);
    }

    check(ref, state) {
        if(state.done && state.pending === 0) {
            this.mergeHandler.merge(ref, state.results);
        }
    }
}
