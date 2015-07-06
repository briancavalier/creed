import { FULFILLED, REJECTED } from './state';
import { isPending } from './refTypes';
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
        let s = h.state();

        if (!isPending(ref)) {
            silenceRejection(h);
        } else if ((s & FULFILLED) > 0) {
            itemHandler.fulfillAt(ref, i, h);
        } else if ((s & REJECTED) > 0) {
            itemHandler.rejectAt(ref, i, h);
        } else {
            h.when(new SettleAt(itemHandler, i, ref));
        }
    } else {
        itemHandler.valueAt(ref, i, x);
    }
}

class SettleAt {
    constructor(handler, index, next, state) {
        this.handler = handler;
        this.index = index;
        this.next = next;
        this.state = state;
    }

    fulfilled(handler) {
        this.handler.fulfillAt(this.next, this.index, handler, this.state);
    }

    rejected(handler) {
        return this.handler.rejectAt(this.next, this.index, handler, this.state);
    }
}
