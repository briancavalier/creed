'use strict';

export default class Race {
    constructor(emptyRef) {
        this.emptyRef = emptyRef;
    }

    valueAt(deferred, i, x) {
        deferred.fulfill(x);
    }

    fulfillAt(deferred, i, ref) {
        deferred.become(ref);
    }

    rejectAt(deferred, i, ref) {
        deferred.become(ref);
    }

    complete(total, deferred) {
        if(total === 0) {
            this.emptyRef(deferred);
        }
    }
}