'use strict';

import { isPending } from './inspect';

export default class Merge {
    constructor(mergeHandler, results) {
        this.done = false;
        this.pending = 0;
        this.results = results;
        this.mergeHandler = mergeHandler;
    }

    valueAt(promise, i, x) {
        this.results[i] = x;
        this.check(this.pending - 1, promise);
    }

    fulfillAt(promise, i, ref) {
        this.valueAt(promise, i, ref.value);
    }

    rejectAt(promise, i, ref) {
        promise._become(ref);
    }

    complete(total, promise) {
        this.done = true;
        this.check(this.pending + total, promise);
    }

    check(pending, promise) {
        this.pending = pending;
        if(this.done && pending === 0) {
            this.mergeHandler.merge(promise, this.results);
        }
    }
}
