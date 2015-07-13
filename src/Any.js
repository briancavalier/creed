'use strict';

import { isPending, silenceError } from './inspect.js';

export default class Any {
    constructor() {
        this.done = false;
        this.pending = 0;
    }

    valueAt(deferred, i, x) {
        deferred.fulfill(x);
    }

    fulfillAt(deferred, i, ref) {
        deferred.become(ref);
    }

    rejectAt(deferred, i, ref) {
        silenceError(ref);
        this.check(this.pending - 1, deferred);
    }

    complete(total, deferred) {
        this.done = true;
        this.check(this.pending + total, deferred);
    }

    check(pending, deferred) {
        this.pending = pending;
        if(this.done && pending === 0) {
            // TODO: Better error
            deferred.reject(new Error());
        }
    }
}