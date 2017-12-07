import { describe, it } from 'mocha'
import { shim, Promise } from '../src/main'
import { is } from '@briancavalier/assert'

/* global self */
let g = typeof self !== 'undefined' ? self
  : typeof global !== 'undefined' ? global
    : undefined

describe('shim', () => {
  it('should return pre-existing Promise', () => {
    let prev = g.Promise
    try {
      is(shim(), prev)
    } finally {
      g.Promise = prev
    }
  })

  it('should set creed Promise', () => {
    let prev = void 0
    try {
      prev = shim()
      is(Promise, g.Promise)
    } finally {
      g.Promise = prev
    }
  })
})
