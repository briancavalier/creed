'use strict';

import { isPending } from './refTypes.js';

export default class Merge {
    constructor(mergeHandler, results) {
        this.done = false;
        this.pending = 0;
        this.results = results;
        this.mergeHandler = mergeHandler;
    }

    valueAt(deferred, i, x) {
        this.results[i] = x;
        this.check(this.pending - 1, deferred);
    }

    fulfillAt(deferred, i, ref) {
        this.valueAt(deferred, i, ref.value);
    }

    rejectAt(deferred, i, ref) {
        deferred.become(ref);
    }

    complete(total, deferred) {
        this.done = true;
        this.check(this.pending + total, deferred);
    }

    check(pending, deferred) {
        this.pending = pending;
        if(this.done && pending === 0) {
            this.mergeHandler.merge(deferred, this.results);
        }
    }
}
