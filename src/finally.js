import Action from './Action'
import maybeThenable from './maybeThenable'
import { isRejected } from './inspect'
import { swapContext, peekContext } from './trace'

export default function (resolve, f, p, promise) {
  p._when(new Finally(resolve, f, promise))
  return promise
}

export class Finally extends Action {
  constructor (resolve, f, promise) {
    super(promise)
    this.resolve = resolve
    this.f = f
  }

  fulfilled (p) {
    this.runFinally(this.f, p)
  }

  rejected (p) {
    return this.runFinally(this.f, p)
  }

  runFinally (f, p) {
    let result
    // test iff `f` throws
    try {
      result = f()
    } catch (e) {
      this.promise._reject(e)
      return true
    }
    return this.handleFinally(p, result)
  }

  handleFinally (p, finallyResult) {
    if (maybeThenable(finallyResult)) {
      this.resolve(finallyResult)._when(new DeferredFinally(p, this.promise))
      return true
    }

    this.promise._become(p)
    return false
  }
}

class DeferredFinally extends Action {
  constructor (result, promise) {
    super(promise)
    this.result = result
  }

  fulfilled (p) {
    if (isRejected(this.result)) {
      this.promise._reject(this.result.value)
      return
    }
    this.promise._become(this.result)
  }
}
