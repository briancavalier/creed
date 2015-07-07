import { isFulfilled, isRejected } from './refTypes';
import silenceRejection from './silenceRejection';
import maybeThenable from './maybeThenable';

export default function(handlerForMaybeThenable, itemHandler, promises, ref) {
    let run = Array.isArray(promises) ? runArray : runIterable;
    return run(handlerForMaybeThenable, itemHandler, promises, ref);
}

function runArray(handlerForMaybeThenable, itemHandler, promises, ref) {
    let i = 0;

    for (; i < promises.length; ++i) {
        handleItem(handlerForMaybeThenable, itemHandler, promises[i], i, ref);
    }

    itemHandler.complete(i, ref);

    return ref;
}

function runIterable(handlerForMaybeThenable, itemHandler, promises, ref) {
    let i = 0;

    for(let x of promises) {
        handleItem(handlerForMaybeThenable, itemHandler, x, i++, ref);
    }

    itemHandler.complete(i, ref);

    return ref;
}

function handleItem(handlerForMaybeThenable, itemHandler, x, i, ref) {
    if (maybeThenable(x)) {
        let h = handlerForMaybeThenable(x);

        if (ref.isResolved()) {
            silenceRejection(h);
        } else if (isFulfilled(h)) {
            itemHandler.fulfillAt(ref, i, h);
        } else if (isRejected(h)) {
            itemHandler.rejectAt(ref, i, h);
        } else {
            h.asap(new SettleAt(itemHandler, i, ref));
        }
    } else {
        itemHandler.valueAt(ref, i, x);
    }
}

class SettleAt {
    constructor(handler, index, next) {
        this.handler = handler;
        this.index = index;
        this.next = next;
    }

    fulfilled(handler) {
        this.handler.fulfillAt(this.next, this.index, handler);
    }

    rejected(handler) {
        return this.handler.rejectAt(this.next, this.index, handler);
    }
}
