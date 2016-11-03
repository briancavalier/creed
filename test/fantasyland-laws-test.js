import { describe, it } from 'mocha'
import { fulfill, Promise } from '../src/main'
import { assertSame } from './lib/test-util'
import * as Functor from 'fantasy-land/laws/functor'
import * as Chain from 'fantasy-land/laws/chain'
import * as Apply from 'fantasy-land/laws/apply'
import * as Applicative from 'fantasy-land/laws/applicative'
import * as Semigroup from 'fantasy-land/laws/semigroup'
import * as Monoid from 'fantasy-land/laws/monoid'
import fl from 'fantasy-land'

const id = x => x

describe('fantasyland laws', () => {
  describe('functor', () => {
    it('should satisfy identity', () => {
      return Functor.identity(fulfill, assertSame, {})
    })

    it('should satisfy composition', () => {
      const f = x => x + 'f'
      const g = x => x + 'g'
      return Functor.composition(fulfill, assertSame, f, g, 'x')
    })

    it('should be covered', () => {
      return fulfill()[fl.map](id)
    })
  })

  describe('apply', () => {
    it('should satisfy composition', () => {
      return Apply.composition(fulfill, assertSame, {})
    })

    it('should be covered', () => {
      return fulfill()[fl.ap](fulfill(id))
    })
  })

  describe('applicative', () => {
    it('should satisfy identity', () => {
      return Applicative.identity(Promise, assertSame, {})
    })

    it('should satisfy homomorphism', () => {
      return Applicative.homomorphism(Promise, assertSame, {})
    })

    it('should satisfy interchange', () => {
      return Applicative.interchange(Promise, assertSame, {})
    })

    it('should be covered', () => {
      return Promise[fl.of](undefined)
    })
  })

  describe('chain', () => {
    it('should satisfy associativity', () => {
      return Chain.associativity(fulfill, assertSame, {})
    })

    it('should be covered', () => {
      return fulfill()[fl.chain](fulfill)
    })
  })

  describe('semigroup', () => {
    it('should satisfy associativity', () => {
      return Semigroup.associativity(fulfill, assertSame, {})
    })

    it('should be covered', () => {
      return fulfill()[fl.concat](fulfill())
    })
  })

  describe('monoid', () => {
    it('should satisfy rightIdentity', () => {
      return Monoid.rightIdentity(Promise, assertSame, {})
    })

    it('should satisfy leftIdentity', () => {
      return Monoid.leftIdentity(Promise, assertSame, {})
    })

    it('should be covered', () => {
      return Promise[fl.empty]().concat(fulfill())
    })
  })
})
