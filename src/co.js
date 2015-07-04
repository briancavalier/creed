'use strict';

export default function(handlerFor, deferred, iterator) {
    coStep(handlerFor, iterator.next, void 0, iterator, deferred);
    return deferred;
};

function coStep(handlerFor, continuation, x, iterator, next) {
    try {
        handle(handlerFor, continuation.call(iterator, x), iterator, next);
    } catch(e) {
        next.reject(e);
    }
}

function handle(handlerFor, result, iterator, next) {
    if(result.done) {
        return next.resolve(result.value);
    }

    handlerFor(result.value).when(new Next(handlerFor, iterator, next));
}

class Next {
    constructor(handlerFor, iterator, next) {
        this.handlerFor = handlerFor;
        this.iterator = iterator;
        this.next = next;
    }

    fulfilled(handler) {
        let iterator = this.iterator;
        coStep(this.handlerFor, iterator.next, handler.value, iterator, this.next);
    }

    rejected(handler) {
        let iterator = this.iterator;
        coStep(this.handlerFor, iterator.throw, handler.value, iterator, this.next);
        return true;
    }
}
