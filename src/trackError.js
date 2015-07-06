'use strict';
import isNode from './isNode';
import { HANDLED } from './state';

let errors = [];
let emitError = initEmitError();

export default function(error) {
    if(errors.length === 0) {
        setTimeout(reportRejections, 1);
    }
    errors.push(error);
}

function reportRejections() {
    let es = errors;
    errors = [];
    for(let i=0; i<es.length; ++i) {
        let e = es[i];
        if((e.state() & HANDLED) === 0) {
            emitError('unhandledRejection', e) || reportError(e);
        }
    }
}

function reportError(e) {
    throw e.value;
}

function initEmitError() {
    /*global process, self, CustomEvent*/
    if(isNode() && typeof process.emit === 'function') {
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
