import { FULFILLED, REJECTED } from './state';
import { isPending } from './refTypes';
import silenceRejection from './silenceRejection';
import maybeThenable from './maybeThenable';

export default function(handlerForMaybeThenable, itemHandler, promises, ref) {
    let i = 0;
    for(let x of promises) {
        if(maybeThenable(x)) {
            let h = handlerForMaybeThenable(x);
            let s = h.state();

            if(!isPending(ref)) {
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

        ++i;
    }

    return ref;
}

class SettleAt {
    constructor(handler, index, next) {
        this.handler = handler;
        this.index = index;
        this.next = next;
    }

    fulfilled(handler) {
        return this.handler.fulfillAt(this.next, this.index, handler);
    }

    rejected(handler) {
        return this.handler.rejectAt(this.next, this.index, handler);
    }
}
