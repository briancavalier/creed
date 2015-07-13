'use strict';

import { PENDING, RESOLVED, FULFILLED, REJECTED, SETTLED } from './state';

export function isPending(ref) {
    return (ref.state() & PENDING) > 0;
}

export function isFulfilled(ref) {
    return (ref.state() & FULFILLED) > 0;
}

export function isRejected(ref) {
    return (ref.state() & REJECTED) > 0;
}

export function isSettled(ref) {
    return (ref.state() & SETTLED) > 0;
}

export function silenceError(ref) {
    if(!isFulfilled(ref)) {
        ref.asap(silencer);
    }
}

const silencer = { fulfilled: always, rejected: always };

function always() {
    return true;
}