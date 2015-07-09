'use strict';

export default function then(f, r, ref, d) {
    ref.when(new Then(f, r, d));
    return d;
}

class Then {
    constructor(f, r, deferred) {
        this.f = f;
        this.r = r;
        this.deferred = deferred;
    }

    fulfilled(ref) {
        runThen(this.f, ref, this.deferred);
    }

    rejected(ref) {
        return runThen(this.r, ref, this.deferred);
    }
}

function runThen(f, ref, deferred) {
    if(typeof f !== 'function') {
        deferred.become(ref);
        return false;
    }

    tryMapNext(f, ref.value, deferred);
    return true;
}

function tryMapNext(f, x, deferred) {
    try {
        deferred.resolve(f(x));
    } catch(e) {
        deferred.reject(e);
    }
}