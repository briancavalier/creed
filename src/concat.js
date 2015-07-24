'use strict';

export default function concat(a, b, future) {
    a._runAction(new Become(future));
    b._runAction(new Become(future));

    return future;
}

class Become {
    constructor(future) {
        this.future = future;
    }

    fulfilled(p) {
        this.future._become(p);
    }

    rejected(p) {
        this.future._become(p);
        return true;
    }
}
