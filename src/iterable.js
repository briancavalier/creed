import { isFulfilled, isRejected, silenceError } from './inspect';
import maybeThenable from './maybeThenable';

export default function (resolve, itemHandler, promises, promise) {
    let run = Array.isArray(promises) ? runArray : runIterable;
    return run(resolve, itemHandler, promises, promise);
}

function runArray(resolve, itemHandler, promises, promise) {
    let i = 0;

    for (; i < promises.length; ++i) {
        handleItem(resolve, itemHandler, promises[i], i, promise);
    }

    itemHandler.complete(i, promise);

    return promise;
}

function runIterable(resolve, itemHandler, promises, promise) {
    let i = 0;

    for (let x of promises) {
        handleItem(resolve, itemHandler, x, i++, promise);
    }

    itemHandler.complete(i, promise);

    return promise;
}

function handleItem(resolve, itemHandler, x, i, promise) {
    if (maybeThenable(x)) {
        let ref = resolve(x);

        if (promise._isResolved()) {
            silenceError(ref);
        } else if (isFulfilled(ref)) {
            itemHandler.fulfillAt(promise, i, ref);
        } else if (isRejected(ref)) {
            itemHandler.rejectAt(promise, i, ref);
        } else {
            ref._runAction(new SettleAt(itemHandler, i, promise));
        }
    } else {
        itemHandler.valueAt(promise, i, x);
    }
}

class SettleAt {
    constructor(handler, index, promise) {
        this.handler = handler;
        this.index = index;
        this.promise = promise;
    }

    fulfilled(ref) {
        this.handler.fulfillAt(this.promise, this.index, ref);
    }

    rejected(ref) {
        return this.handler.rejectAt(this.promise, this.index, ref);
    }
}
