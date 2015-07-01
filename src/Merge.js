'use strict';

import resolveIterable from './iterable';
import { isPending } from './refTypes.js';

export default class Merge {
    constructor(f, c, n) {
        this.f = f;
        this.c = c;
        this.pending = n;
        this.results = new Array(n);
    }

    valueAt(ref, i, x) {
        this.results[i] = x;
        if(--this.pending === 0 && isPending(ref)) {
            merge(this.f, this.c, this.results, ref);
        }
    }

    fulfillAt(ref, i, h) {
        this.valueAt(ref, i, h.value);
        return true;
    }

    rejectAt(ref, i, h) {
        ref.become(h);
        return false;
    }
}

function merge(f, c, args, ref) {
    try {
        ref.resolve(f.apply(c, args));
    } catch(e) {
        ref.reject(e);
    }
}