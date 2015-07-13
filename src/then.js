'use strict';

export default function then(f, r, ref, promise) {
    ref._when(new Then(f, r, promise));
    return promise;
}

class Then {
    constructor(f, r, promise) {
        this.f = f;
        this.r = r;
        this.promise = promise;
    }

    fulfilled(ref) {
        runThen(this.f, ref, this.promise);
    }

    rejected(ref) {
        return runThen(this.r, ref, this.promise);
    }
}

function runThen(f, ref, promise) {
    if(typeof f !== 'function') {
        promise._become(ref);
        return false;
    }

    tryMapNext(f, ref.value, promise);
    return true;
}

function tryMapNext(f, x, promise) {
    try {
        promise._resolve(f(x));
    } catch(e) {
        promise._reject(e);
    }
}
