'use strict';

export default function chain(f, p, promise) {
    p._when(new Chain(f, promise));
    return promise;
}

class Chain {
    constructor(f, promise) {
        this.f = f;
        this.promise = promise;
    }

    fulfilled(p) {
        try {
            let f = this.f;
            this.promise._resolve(f(p.value).near());
        } catch (e) {
            this.promise._reject(e);
        }
    }

    rejected(p) {
        this.promise._become(p);
        return false;
    }
}
