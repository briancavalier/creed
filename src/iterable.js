import { FULFILLED, REJECTED } from './state';
import { isPending } from './refTypes';
import silenceRejection from './silenceRejection';
import maybeThenable from './maybeThenable';

export default function(handlerForMaybeThenable, itemHandler, promises, ref) {
    let i = 0;
    let state = itemHandler.init(promises, ref);

    for(let x of promises) {
        if(maybeThenable(x)) {
            let h = handlerForMaybeThenable(x);
            let s = h.state();

            if(!isPending(ref)) {
                silenceRejection(h);
            } else if ((s & FULFILLED) > 0) {
                itemHandler.fulfillAt(ref, i, h, state);
            } else if ((s & REJECTED) > 0) {
                itemHandler.rejectAt(ref, i, h, state);
            } else {
                h.when(new SettleAt(itemHandler, i, ref, state));
            }
        } else {
            itemHandler.valueAt(ref, i, x, state);
        }

        ++i;
    }

    itemHandler.complete(i, ref, state);

    return ref;
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
