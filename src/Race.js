'use strict';

export default class Race {
    valueAt(ref, i, x) {
        ref.fulfill(x);
    }

    fulfillAt(ref, i, h) {
        ref.become(h);
        return true;
    }

    rejectAt(ref, i, h) {
        ref.become(h);
        return false;
    }
}