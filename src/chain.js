'use strict';

import maybeThenable from './maybeThenable';

export default function chain(f, p, future) {
    p._when(new Chain(f, future));
    return future;
}

class Chain {
    constructor(f, future) {
        this.f = f;
        this.future = future;
    }

    fulfilled(p) {
        try {
            let f = this.f;
            this.future._resolve(checkAndResolve(f(p.value)));
        } catch (e) {
            this.future._reject(e);
        }
    }

    rejected(p) {
        this.future._become(p);
        return false;
    }
}

function checkAndResolve(x) {
    if (maybeThenable(x) && typeof x.then === 'function') {
        return x;
    }

    throw new TypeError('chain function must return thenable');
}
