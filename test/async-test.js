import { describe, it } from 'mocha'
import makeAsync from '../src/async'

describe('makeAsync', () => {
  it('should make a function that invokes later', done => {
    const async = makeAsync(done)
    async()
  })
})
