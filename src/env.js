'use strict'

/*global process,MutationObserver,WebKitMutationObserver */

let isNode = typeof process !== 'undefined' &&
    Object.prototype.toString.call(process) === '[object process]'

/* istanbul ignore next */
let MutationObs = (typeof MutationObserver === 'function' && MutationObserver) ||
    (typeof WebKitMutationObserver === 'function' && WebKitMutationObserver)

export { isNode, MutationObs }
