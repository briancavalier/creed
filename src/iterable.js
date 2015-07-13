import { isFulfilled, isRejected, silenceError } from './inspect';
import maybeThenable from './maybeThenable';

export default function(refFor, itemHandler, promises, deferred) {
    let run = Array.isArray(promises) ? runArray : runIterable;
    return run(refFor, itemHandler, promises, deferred);
}

function runArray(refFor, itemHandler, promises, deferred) {
    let i = 0;

    for (; i < promises.length; ++i) {
        handleItem(refFor, itemHandler, promises[i], i, deferred);
    }

    itemHandler.complete(i, deferred);

    return deferred;
}

function runIterable(refFor, itemHandler, promises, deferred) {
    let i = 0;

    for(let x of promises) {
        handleItem(refFor, itemHandler, x, i++, deferred);
    }

    itemHandler.complete(i, deferred);

    return deferred;
}

function handleItem(refFor, itemHandler, x, i, deferred) {
    if (maybeThenable(x)) {
        let ref = refFor(x);

        if (deferred.isResolved()) {
            silenceError(ref);
        } else if (isFulfilled(ref)) {
            itemHandler.fulfillAt(deferred, i, ref);
        } else if (isRejected(ref)) {
            itemHandler.rejectAt(deferred, i, ref);
        } else {
            ref.asap(new SettleAt(itemHandler, i, deferred));
        }
    } else {
        itemHandler.valueAt(deferred, i, x);
    }
}

class SettleAt {
    constructor(handler, index, deferred) {
        this.handler = handler;
        this.index = index;
        this.deferred = deferred;
    }

    fulfilled(ref) {
        this.handler.fulfillAt(this.deferred, this.index, ref);
    }

    rejected(ref) {
        return this.handler.rejectAt(this.deferred, this.index, ref);
    }
}
