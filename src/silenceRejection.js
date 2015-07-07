'use strict';
import { isFulfilled } from './refTypes';

export default function(h) {
    !isFulfilled(h) && h.asap(rejectionSilencer);
}

const rejectionSilencer = { rejected: always, fulfilled: always };

function always() {
    return true;
}