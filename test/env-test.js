import { describe, it } from 'mocha'
import { isNode } from '../src/env'
import { eq } from '@briancavalier/assert'

describe('env', () => {
  describe('isNode', () => {
    it('should be boolean', () => {
      eq('boolean', typeof isNode)
    })
  })
})
