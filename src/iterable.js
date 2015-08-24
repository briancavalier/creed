import { isFulfilled, isRejected, silenceError } from './inspect';
import maybeThenable from './maybeThenable';

export function resultsArray(iterable) {
    return Array.isArray(iterable) ? new Array(iterable.length) : [];
}

export function resolveIterable(resolve, itemHandler, promises, promise) {
    let run = Array.isArray(promises) ? runArray : runIterable;
    try {
        run(resolve, itemHandler, promises, promise);
    } catch (e) {
        promise._reject(e);
    }
    return promise.near();
}

function runArray(resolve, itemHandler, promises, promise) {
    let i = 0;

    for (; i < promises.length; ++i) {
        handleItem(resolve, itemHandler, promises[i], i, promise);
    }

    itemHandler.complete(i, promise);
}

function runIterable(resolve, itemHandler, promises, promise) {
    let i = 0;

    for (let x of promises) {
        handleItem(resolve, itemHandler, x, i++, promise);
    }

    itemHandler.complete(i, promise);
}

function handleItem(resolve, itemHandler, x, i, promise) {
    if (maybeThenable(x)) {
        let p = resolve(x);

        if (promise._isResolved()) {
            if(!isFulfilled(p)) {
                silenceError(p);
            }
        } else if (isFulfilled(p)) {
            itemHandler.fulfillAt(p, i, promise);
        } else if (isRejected(p)) {
            itemHandler.rejectAt(p, i, promise);
        } else {
            p._runAction(new SettleAt(itemHandler, i, promise));
        }
    } else {
        itemHandler.valueAt(x, i, promise);
    }
}

class SettleAt {
    constructor(handler, index, promise) {
        this.handler = handler;
        this.index = index;
        this.promise = promise;
    }

    fulfilled(p) {
        this.handler.fulfillAt(p, this.index, this.promise);
    }

    rejected(p) {
        return this.handler.rejectAt(p, this.index, this.promise);
    }
}
