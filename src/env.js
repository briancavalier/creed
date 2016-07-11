/*global process,MutationObserver,WebKitMutationObserver */

const isNode = typeof process !== 'undefined' &&
    Object.prototype.toString.call(process) === '[object process]'

/* istanbul ignore next */
const MutationObs = (typeof MutationObserver === 'function' && MutationObserver) ||
    (typeof WebKitMutationObserver === 'function' && WebKitMutationObserver)

export { isNode, MutationObs }
