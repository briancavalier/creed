'use strict';

export default class Race {
    constructor(empty) {
        this.empty = empty;
    }

    valueAt(ref, i, x) {
        ref.fulfill(x);
    }

    fulfillAt(ref, i, h) {
        ref.become(h);
    }

    rejectAt(ref, i, h) {
        ref.become(h);
    }

    complete(total, ref) {
        if(total === 0) {
            this.empty(ref);
        }
    }
}