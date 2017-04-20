import { pushContext } from './trace'

export default class Action {
  constructor (promise) {
    this.promise = promise
    this.context = pushContext(this.constructor)
  }

  // default onFulfilled action
  /* istanbul ignore next */
  fulfilled (p) {
    this.promise._become(p)
  }

  // default onRejected action
  rejected (p) {
    this.promise._become(p)
    return false
  }
}
