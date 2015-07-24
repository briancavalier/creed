'use strict';

export default function chain(isPromise, f, p, promise) {
    p._when(new Chain(isPromise, f, promise));
    return promise;
}

class Chain {
    constructor(isPromise, f, promise) {
        this.f = f;
        this.promise = promise;
    }

    fulfilled(p) {
        try {
            this.promise._resolve(this.f(p.value).near());
        } catch (e) {
            this.promise._reject(e);
        }
    }

    rejected(p) {
        this.promise._become(p);
        return false;
    }
}
