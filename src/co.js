'use strict';

export default function(handlerFor, Deferred) {
    function coStep(continuation, x, iterator, next) {
        try {
            handle(continuation.call(iterator, x), iterator, next);
        } catch(e) {
            next.reject(e);
        }
    }

    function handle(result, iterator, next) {
        if(result.done) {
            return next.resolve(result.value);
        }

        handlerFor(result.value).when(new Next(iterator, next));
    }

    class Next {
        constructor(iterator, next) {
            this.iterator = iterator;
            this.next = next;
        }

        fulfilled(handler) {
            var iterator = this.iterator;
            coStep(iterator.next, handler.value, iterator, this.next);
            return true;
        }

        rejected(handler) {
            var iterator = this.iterator;
            coStep(iterator.throw, handler.value, iterator, this.next);
            return true;
        }
    }

    return function(iterator) {
        let next = new Deferred();
        coStep(iterator.next, void 0, iterator, next);
        return next;
    };
}
