import { FULFILLED, REJECTED } from './state';
import maybeThenable from './maybeThenable';

export default function(handlerForMaybeThenable, Deferred, Fulfilled) {
    class Iterable extends Deferred {
        constructor(itemHandler, promises) {
            super();
            this.resolveAll(itemHandler, promises);
        }

        resolveAll(itemHandler, promises) {
            let i = 0;
            for(let x of promises) {
                if(maybeThenable(x)) {
                    let h = handlerForMaybeThenable(x);
                    let s = h.state();

                    if(!this.isPending()) {
                        itemHandler.ignored(this, i, h);
                    } else if ((s & FULFILLED) > 0) {
                        itemHandler.fulfilled(this, i, h);
                    } else if ((s & REJECTED) > 0) {
                        itemHandler.rejected(this, i, h);
                    } else {
                        h.when(new SettleAt(itemHandler, this, i));
                    }
                } else {
                    itemHandler.fulfilled(this, i, new Fulfilled(x));
                }

                ++i;
            }
        }
    }

    return Iterable;
}

class SettleAt {
    constructor(handler, iterable, index) {
        this.handler = handler;
        this.iterable = iterable;
        this.index = index;
    }

    fulfilled(handler) {
        return this.handler.fulfilled(this.iterable, this.index, handler);
    }

    rejected(handler) {
        return this.handler.rejected(this.iterable, this.index, handler);
    }
}
