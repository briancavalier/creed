'use strict';
import { isNode } from './env';
import { silenceError, isHandled } from './inspect';

const UNHANDLED_REJECTION = 'unhandledRejection';
const HANDLED_REJECTION = 'rejectionHandled';

let emitError = initEmitError();

export default class ErrorHandler {
    constructor() {
        this.errors = [];
    }

    track(e) {
        if (!emitError(UNHANDLED_REJECTION, e)) {
            if (this.errors.length === 0) {
                setTimeout(reportErrors, 1, this.errors);
            }
            this.errors.push(e);
        }
    }

    untrack(e) {
        silenceError(e);
        emitError(HANDLED_REJECTION, e);
    }
}

function reportErrors(errors) {
    for (let i = 0; i < errors.length; ++i) {
        let e = errors[i];
        if (!isHandled(e)) {
            throw e.value;
        }
    }
    errors.length = 0;
}

function initEmitError() {
    /*global process, self, CustomEvent*/
    if (isNode && typeof process.emit === 'function') {
        // Returning falsy here means to call the default reportRejection API.
        // This is safe even in browserify since process.emit always returns
        // falsy in browserify:
        // https://github.com/defunctzombie/node-process/blob/master/browser.js#L40-L46
        return function (type, error) {
            return type === UNHANDLED_REJECTION
                ? process.emit(type, error.value, error)
                : process.emit(type, error);
        };
    } else if (typeof self !== 'undefined' && typeof CustomEvent === 'function') {
        return (function (noop, self, CustomEvent) {
            let hasCustomEvent = false;
            try {
                hasCustomEvent = new CustomEvent(UNHANDLED_REJECTION) instanceof CustomEvent;
            } catch (e) {}

            return !hasCustomEvent ? noop : function (type, error) {
                let ev = new CustomEvent(type, {
                    detail: {
                        reason: error.value,
                        promise: error
                    },
                    bubbles: false,
                    cancelable: true
                });

                return !self.dispatchEvent(ev);
            };
        }(noop, self, CustomEvent));
    }

    return noop;
}

function noop() {}
