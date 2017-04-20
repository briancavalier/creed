import { describe, it } from 'mocha'
import { timeout, delay } from '../src/main'
import TimeoutError from '../src/TimeoutError'
import { Future, reject, fulfill } from '../src/Promise'
import { silenceError } from '../src/inspect'
import { assertInstanceOf, rejectsWith } from './lib/test-util'
import { is } from '@briancavalier/assert'

function delayReject (ms, e) {
  const p = new Future()
  setTimeout(e => p._reject(e), ms, e)
  return p
}

const isTimeoutError = assertInstanceOf(TimeoutError)

describe('timeout', function () {
  it('should be identity for fulfilled', () => {
    const p = fulfill()
    is(p, timeout(0, p))
  })

  it('should be identity for rejected', () => {
    const p = reject()
    silenceError(p)
    is(p, timeout(0, p))
  })

  it('should reject if timeout is earlier than fulfill', () => {
    const p = timeout(1, delay(10, true))
    return rejectsWith(isTimeoutError, p)
  })

  it('should fulfill if timeout is later than fulfill', () => {
    const x = {}
    return timeout(10, delay(1, x)).then(is(x))
  })

  it('should reject if timeout is earlier than reject', () => {
    const p = timeout(1, delayReject(10, new Error()))
    return rejectsWith(isTimeoutError, p)
  })

  it('should reject if timeout is later than reject', () => {
    const x = new Error()
    const p = timeout(10, delayReject(1, x))
    return rejectsWith(is(x), p)
  })
})
