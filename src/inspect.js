'use strict';

import { PENDING, RESOLVED, FULFILLED, REJECTED, SETTLED } from './state';

export function isPending(p) {
    return (p.state() & PENDING) > 0;
}

export function isFulfilled(p) {
    return (p.state() & FULFILLED) > 0;
}

export function isRejected(p) {
    return (p.state() & REJECTED) > 0;
}

export function isSettled(p) {
    return (p.state() & SETTLED) > 0;
}

export function silenceError(p) {
    if(!isFulfilled(p)) {
        p._runAction(silencer);
    }
}

const silencer = { fulfilled: always, rejected: always };

function always() {
    return true;
}