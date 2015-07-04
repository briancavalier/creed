'use strict';

export default class Race {
    init() {}

    valueAt(ref, i, x) {
        ref.fulfill(x);
    }

    fulfillAt(ref, i, h) {
        ref.become(h);
    }

    rejectAt(ref, i, h) {
        ref.become(h);
    }

    complete() {}
}