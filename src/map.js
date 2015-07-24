'use strict';

export default function map(f, p, promise) {
    p._when(new Map(f, promise));
    return promise;
}

class Map {
    constructor(f, promise) {
        this.f = f;
        this.promise = promise;
    }

    fulfilled(p) {
        try {
            let f = this.f;
            this.promise._fulfill(f(p.value));
        } catch (e) {
            this.promise._reject(e);
        }
    }

    rejected(p) {
        this.promise._become(p);
        return false;
    }
}
