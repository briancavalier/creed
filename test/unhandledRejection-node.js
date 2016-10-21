import { describe, it } from 'mocha'
import { race, reject, all, future } from '../src/main'
import { isHandled } from '../src/inspect'

const delayRejectWith = (ms, e) => {
  const { resolve, promise } = future()
  setTimeout((resolve, e) => resolve(reject(e)), ms, resolve, e)
  return promise
}

const expectOne = aggregate => done => {
  const expected = new Error('expected')

  // Arrange for 2 delayed rejections. The first will cause the promise
  // returned by aggregate() to reject, and the second should be silenced.
  // After the first rejects, arrange to intercept the second via unhandledRejection.
  // After another delay, giving the second promise enough time to have been silenced,
  // check to see if it was indeed silenced.
  aggregate([delayRejectWith(10, expected), delayRejectWith(15, new Error('Unsilenced rejection'))])
    .catch(() => {
      const rejections = []
      const unhandledRejection = (e, p) => rejections.push(p)
      const rejectionHandled = p => rejections.splice(rejections.indexOf(p), 1)

      process.on('unhandledRejection', unhandledRejection)
      process.on('rejectionHandled', rejectionHandled)

      setTimeout(() => {
        process.removeListener('unhandledRejection', unhandledRejection)
        process.removeListener('rejectionHandled', rejectionHandled)

        const remaining = rejections.filter(r => !isHandled(r))
        if(remaining.length > 0) {
          done(remaining.pop().value)
        } else {
          done()
        }
      }, 50)
    })
}

describe('unhandledRejection-node', () => {
  it('race should emit 1 unhandledRejection', expectOne(race))
  it('all should emit 1 unhandledRejection', expectOne(all))
})
