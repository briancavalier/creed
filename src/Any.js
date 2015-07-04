'use strict';

import silenceRejection from './silenceRejection';
import { isPending } from './refTypes.js';

export default class Any {
    init() {
        return { done: false, pending: 0 };
    }

    valueAt(ref, i, x, state) {
        ref.fulfill(x);
    }

    fulfillAt(ref, i, h, state) {
        ref.become(h);
    }

    rejectAt(ref, i, h, state) {
        --state.pending;
        silenceRejection(h);
        this.check(ref, state);
    }

    complete(total, ref, state) {
        state.done = true;
        state.pending += total;
        this.check(ref, state);
    }

    check(ref, state) {
        if(state.done && state.pending === 0) {
            ref.reject(new Error());
        }
    }
}