'use strict';

import silenceRejection from './silenceRejection';
import { isPending } from './refTypes.js';

export default class Any {
    constructor(n) {
        this.pending = n;
    }

    valueAt(ref, i, x) {
        ref.fulfill(x);
    }

    fulfillAt(ref, i, h) {
        ref.become(h);
        return true;
    }

    rejectAt(ref, i, h) {
        if(--this.pending === 0 && isPending(ref)) {
            ref.become(h);
        } else {
            silenceRejection(h);
        }
        return false;
    }
}