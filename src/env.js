/* global process,MutationObserver,WebKitMutationObserver */

const isNode = typeof process !== 'undefined' &&
    Object.prototype.toString.call(process) === '[object process]'

/* istanbul ignore next */
const MutationObs = (typeof MutationObserver === 'function' && MutationObserver) ||
    (typeof WebKitMutationObserver === 'function' && WebKitMutationObserver)

const getenv = name => isNode && process.env[name]

const isDebug = getenv('CREED_DEBUG') ||
  getenv('NODE_ENV') === 'development' ||
  getenv('NODE_ENV') === 'test'

export { isNode, MutationObs, isDebug }
