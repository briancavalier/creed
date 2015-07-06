'use strict';

import { isPending } from './refTypes.js';

export default class Merge {
    constructor(mergeHandler, results) {
        this.done = false;
        this.pending = 0;
        this.results = results;
        this.mergeHandler = mergeHandler;
    }

    valueAt(ref, i, x) {
        this.results[i] = x;
        this.check(this.pending - 1, ref);
    }

    fulfillAt(ref, i, h) {
        this.valueAt(ref, i, h.value);
    }

    rejectAt(ref, i, h) {
        ref.become(h);
    }

    complete(total, ref) {
        this.done = true;
        this.check(this.pending + total, ref);
    }

    check(pending, ref) {
        this.pending = pending;
        if(this.done && pending === 0) {
            this.mergeHandler.merge(ref, this.results);
        }
    }
}
