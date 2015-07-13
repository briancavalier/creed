'use strict';

import { isPending, silenceError } from './inspect.js';

export default class Any {
    constructor() {
        this.done = false;
        this.pending = 0;
    }

    valueAt(promise, i, x) {
        promise._fulfill(x);
    }

    fulfillAt(promise, i, ref) {
        promise._become(ref);
    }

    rejectAt(promise, i, ref) {
        silenceError(ref);
        this.check(this.pending - 1, promise);
    }

    complete(total, promise) {
        this.done = true;
        this.check(this.pending + total, promise);
    }

    check(pending, promise) {
        this.pending = pending;
        if(this.done && pending === 0) {
            // TODO: Better error
            promise._reject(new Error());
        }
    }
}