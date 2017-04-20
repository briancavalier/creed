import Action from './Action'
import tryCall from './tryCall'

export default function then (f, r, p, promise) {
  p._when(new Then(f, r, promise))
  return promise
}

class Then extends Action {
  constructor (f, r, promise) {
    super(promise)
    this.f = f
    this.r = r
  }

  fulfilled (p) {
    this.runThen(this.f, p)
  }

  rejected (p) {
    return this.runThen(this.r, p)
  }

  runThen (f, p) {
    if (typeof f !== 'function') {
      this.promise._become(p)
      return false
    }
    tryCall(f, p.value, handleThen, this.promise)
    return true
  }
}

function handleThen (promise, result) {
  promise._resolve(result)
}
