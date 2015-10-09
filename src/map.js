'use strict';

import maybeThenable from './maybeThenable';

export function map(f, p, promise) {
    return runMap(applyMap, f, p, promise);
}

export function chain(f, p, promise) {
    return runMap(applyChain, f, p, promise);
}

function runMap(apply, f, p, promise) {
    p._when(new Map(apply, f, promise));
    return promise;
}

function applyMap(f, x, p) {
    p._fulfill(f(x));
}

function applyChain(f, x, p) {
    let y = f(x);
    if (maybeThenable(y) && typeof y.then === 'function') {
        p._resolve(y);
    } else {
        p._reject(new TypeError('f must return a promise'));
    }
}

class Map {
    constructor(apply, f, promise) {
        this.apply = apply;
        this.f = f;
        this.promise = promise;
    }

    fulfilled(p) {
        try {
            this.apply(this.f, p.value, this.promise);
        } catch (e) {
            this.promise._reject(e);
        }
    }

    rejected(p) {
        this.promise._become(p);
    }
}

