'use strict';

export default function then(f, r, ref, deferred) {
    ref.when(new Then(f, r, deferred));
    return deferred;
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

    tryMapNext(f, ref, deferred);
    return true;
}

function tryMapNext(f, ref, deferred) {
    try {
        deferred.resolve(f(ref.value));
    } catch(e) {
        deferred.reject(e);
    }
}
