'use strict';
import { FULFILLED } from './state';

export default function(h) {
    (h.state() & FULFILLED) === 0 && h.when(rejectionSilencer);
}

const rejectionSilencer = { rejected: always, fulfilled: always };

function always() {
    return true;
}