import { FULFILLED, REJECTED } from './state';
import maybeThenable from './maybeThenable';
import { isPending } from './refTypes';

export default function(handlerForMaybeThenable, itemHandler, promises, deferred) {
    let i = 0;
    for(let x of promises) {
        if(maybeThenable(x)) {
            let h = handlerForMaybeThenable(x);
            let s = h.state();

            if(!isPending(deferred)) {
                itemHandler.ignoreAt(deferred, i, h);
            } else if ((s & FULFILLED) > 0) {
                itemHandler.fulfillAt(deferred, i, h);
            } else if ((s & REJECTED) > 0) {
                itemHandler.rejectAt(deferred, i, h);
            } else {
                h.when(new SettleAt(itemHandler, i, deferred));
            }
        } else {
            itemHandler.valueAt(deferred, i, x);
        }

        ++i;
    }

    return deferred;
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
