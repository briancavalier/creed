'use strict';

import silenceRejection from './silenceRejection';
import { isPending } from './refTypes.js';

export default class Any {
    constructor() {
        this.done = false;
        this.pending = 0;
    }

    valueAt(ref, i, x) {
        ref.fulfill(x);
    }

    fulfillAt(ref, i, h) {
        ref.become(h);
    }

    rejectAt(ref, i, h) {
        silenceRejection(h);
        this.check(this.pending - 1, ref);
    }

    complete(total, ref) {
        this.done = true;
        this.check(this.pending + total, ref);
    }

    check(pending, ref) {
        this.pending = pending;
        if(this.done && pending === 0) {
            ref.reject(new Error());
        }
    }
}