'use strict';
import { isFulfilled, isRejected } from './refTypes';

export default function then(Deferred, f, r, h) {
    if((isFulfilled(h) && typeof f !== 'function') ||
        (isRejected(h) && typeof r !== 'function')) {
        return h;
    }

    let d = new Deferred();
    h.when(new Then(f, r, d));
    return d;
}

class Then {
    constructor(f, r, next) {
        this.f = f;
        this.r = r;
        this.next = next;
    }

    fulfilled(handler) {
        return runThen(this.f, handler, this.next);
    }

    rejected(handler) {
        return runThen(this.r, handler, this.next);
    }
}

function runThen(f, handler, next) {
    if(typeof f !== 'function') {
        next.become(handler);
        return false;
    }

    tryMapNext(f, handler.value, next);
    return true;
}

function tryMapNext(f, x, next) {
    try {
        next.resolve(f(x));
    } catch(e) {
        next.reject(e);
    }
}