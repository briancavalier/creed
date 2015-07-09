import { isFulfilled, isRejected, silenceError } from './refTypes';
import maybeThenable from './maybeThenable';

export default function(refForMaybeThenable, itemHandler, promises, ref) {
    let run = Array.isArray(promises) ? runArray : runIterable;
    return run(refForMaybeThenable, itemHandler, promises, ref);
}

function runArray(refForMaybeThenable, itemHandler, promises, ref) {
    let i = 0;

    for (; i < promises.length; ++i) {
        handleItem(refForMaybeThenable, itemHandler, promises[i], i, ref);
    }

    itemHandler.complete(i, ref);

    return ref;
}

function runIterable(refForMaybeThenable, itemHandler, promises, ref) {
    let i = 0;

    for(let x of promises) {
        handleItem(refForMaybeThenable, itemHandler, x, i++, ref);
    }

    itemHandler.complete(i, ref);

    return ref;
}

function handleItem(refForMaybeThenable, itemHandler, x, i, deferred) {
    if (maybeThenable(x)) {
        let ref = refForMaybeThenable(x);

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
