'use strict';
import { isNode } from './env';
import { silenceError, isHandled } from './inspect';

let emitError = initEmitError();

export default class ErrorHandler {
    constructor(report) {
        this.errors = [];
        this.report = report;
    }

    track(e) {
        if(this.errors.length === 0) {
            setTimeout(reportErrors, 1, this.report, this.errors);
        }
        this.errors.push(e);
    }

    untrack(e) {
        silenceError(e);
    }
}

function reportErrors(reportError, errors) {
    for(let i=0; i<errors.length; ++i) {
        let e = errors[i];
        if(!isHandled(e)) {
            emitError('unhandledRejection', e) || reportError(e);
        }
    }
    errors.length = 0;
}

function initEmitError() {
    /*global process, self, CustomEvent*/
    if(isNode && typeof process.emit === 'function') {
        // Returning falsy here means to call the default reportRejection API.
        // This is safe even in browserify since process.emit always returns
        // falsy in browserify:
        // https://github.com/defunctzombie/node-process/blob/master/browser.js#L40-L46
        return function(type, error) {
            return type === 'unhandledRejection'
                ? process.emit(type, error.value, error)
                : process.emit(type, error);
        };
    } else if(typeof self !== 'undefined' && typeof CustomEvent === 'function') {
        return (function(noop, self, CustomEvent) {
            let hasCustomEvent = false;
            try {
                hasCustomEvent = new CustomEvent('unhandledRejection') instanceof CustomEvent;
            } catch (e) {}

            return !hasCustomEvent ? noop : function(type, error) {
                let ev = new CustomEvent(type, {
                    detail: {
                        reason: error.value,
                        key: error
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
