'use strict';

import { isFulfilled, isRejected } from './inspect';

export default function(refFor, deferred, iterator) {
    coStep(refFor, iterator.next, void 0, iterator, deferred);
    return deferred;
};

function coStep(refFor, continuation, x, iterator, deferred) {
    try {
        handle(refFor, continuation.call(iterator, x), iterator, deferred);
    } catch(e) {
        deferred.reject(e);
    }
}

function handle(refFor, result, iterator, deferred) {
    if(result.done) {
        return deferred.resolve(result.value);
    }

    refFor(result.value).asap(new Next(refFor, iterator, deferred));
}

class Next {
    constructor(refFor, iterator, deferred) {
        this.refFor = refFor;
        this.iterator = iterator;
        this.deferred = deferred;
    }

    fulfilled(ref) {
        let iterator = this.iterator;
        coStep(this.refFor, iterator.next, ref.value, iterator, this.deferred);
    }

    rejected(ref) {
        let iterator = this.iterator;
        coStep(this.refFor, iterator.throw, ref.value, iterator, this.deferred);
        return true;
    }
}
