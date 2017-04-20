import { Map } from './map'
import tryCall from './tryCall'

export default function (r, f, p, promise) {
  p._when(new Bimap(r, f, promise))
  return promise
}

class Bimap extends Map {
  constructor (r, f, promise) {
    super(f, promise)
    this.r = r
  }

  rejected (p) {
    tryCall(this.r, p.value, handleMapRejected, this.promise)
  }
}

function handleMapRejected (promise, result) {
  promise._reject(result)
}
