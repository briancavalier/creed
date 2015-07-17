'use strict';

export default function (refFor, iterator, promise) {
    coStep(refFor, iterator.next, void 0, iterator, promise);
    return promise;
};

function coStep(refFor, continuation, x, iterator, promise) {
    try {
        handle(refFor, continuation.call(iterator, x), iterator, promise);
    } catch (e) {
        promise._reject(e);
    }
}

function handle(refFor, result, iterator, promise) {
    if (result.done) {
        return promise._resolve(result.value);
    }

    refFor(result.value)._runAction(new Next(refFor, iterator, promise));
}

class Next {
    constructor(refFor, iterator, promise) {
        this.refFor = refFor;
        this.iterator = iterator;
        this.promise = promise;
    }

    fulfilled(ref) {
        let iterator = this.iterator;
        coStep(this.refFor, iterator.next, ref.value, iterator, this.promise);
    }

    rejected(ref) {
        let iterator = this.iterator;
        coStep(this.refFor, iterator.throw, ref.value, iterator, this.promise);
        return true;
    }
}
