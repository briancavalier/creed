'use strict';

import { PENDING, FULFILLED, REJECTED, SETTLED, NEVER, HANDLED } from './state';

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

export function isNever(p) {
    return (p.state() & NEVER) > 0;
}

export function isHandled(p) {
    return (p.state() & HANDLED) > 0;
}

export function silenceError(p) {
    if (!isFulfilled(p)) {
        p._runAction(silencer);
    }
}

const silencer = {
    fulfilled() {},
    rejected(p) {
        p._state |= HANDLED;
    }
};
