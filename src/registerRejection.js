'use strict';
import isNode from './isNode';
import { HANDLED } from './state';

let rejections = [];
let rejectionTask = null;
let emitRejection = initEmitRejection();

export default function registerRejection(rejected) {
    rejections.push(rejected);
    if(rejectionTask === null) {
        rejectionTask = setTimeout(reportRejections, 1);
    }
}

function reportRejections() {
    rejectionTask = null;

    while(rejections.length > 0) {
        let rejection = rejections.shift();
        if((rejection.state() & HANDLED) === 0) {
            emitRejection('unhandledRejection', rejection)
                || reportRejection(rejection);
        }
    }
}

function reportRejection(rejection) {
    throw rejection.value;
}

function initEmitRejection() {
    /*global process, self, CustomEvent*/
    if(isNode() && typeof process.emit === 'function') {
        // Returning falsy here means to call the default
        // onPotentiallyUnhandledRejection API.  This is safe even in
        // browserify since process.emit always returns falsy in browserify:
        // https://github.com/defunctzombie/node-process/blob/master/browser.js#L40-L46
        return function(type, rejection) {
            return type === 'unhandledRejection'
                ? process.emit(type, rejection.value, rejection)
                : process.emit(type, rejection);
        };
    } else if(typeof self !== 'undefined' && typeof CustomEvent === 'function') {
        return (function(noop, self, CustomEvent) {
            var hasCustomEvent = false;
            try {
                var ev = new CustomEvent('unhandledRejection');
                hasCustomEvent = ev instanceof CustomEvent;
            } catch (e) {}

            return !hasCustomEvent ? noop : function(type, rejection) {
                var ev = new CustomEvent(type, {
                    detail: {
                        reason: rejection.value,
                        key: rejection
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
