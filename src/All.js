'use strict';

import { isPending } from './refTypes.js';

export default class All {
    constructor(n) {
        this.pending = n;
        this.results = new Array(n);
    }

    valueAt(ref, i, x) {
        this.results[i] = x;
        if(--this.pending === 0 && isPending(ref)) {
            ref.fulfill(this.results);
        }
    }

    fulfillAt(ref, i, h) {
        this.valueAt(ref, i, h.value);
        return true;
    }

    rejectAt(ref, i, h) {
        ref.become(h);
        return false;
    }
}
