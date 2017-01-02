import { describe, it } from 'mocha'
import assert from 'assert'
import { fulfill, reject, Promise } from '../src/main'
import { isNever } from '../src/inspect'
import { assertSame } from './lib/test-util'
import * as Functor from 'fantasy-land/laws/functor'
import * as Bifunctor from 'fantasy-land/laws/bifunctor'
import * as Chain from 'fantasy-land/laws/chain'
import * as Apply from 'fantasy-land/laws/apply'
import * as Applicative from 'fantasy-land/laws/applicative'
import * as Semigroup from 'fantasy-land/laws/semigroup'
import * as Monoid from 'fantasy-land/laws/monoid'
import * as Alt from 'fantasy-land/laws/alt'
import * as Plus from 'fantasy-land/laws/plus'
import * as Alternative from 'fantasy-land/laws/alternative'

const assertIsNever = x => assert(isNever(x))

describe('fantasyland laws', () => {
  describe('functor', () => {
    it('should satisfy identity', () => {
      return Functor.identity(fulfill)(assertSame)({})
    })

    it('should satisfy composition', () => {
      const f = x => x + 'f'
      const g = x => x + 'g'
      return Functor.composition(fulfill)(assertSame)(f)(g)('x')
    })
  })

  describe('bifunctor', () => {
    it('should satisfy identity for fulfill', () => {
      return Bifunctor.identity(fulfill)(assertSame)({})
    })

    it('should satisfy identity for reject', () => {
      return Bifunctor.identity(reject)(assertSame)({})
    })

    it('should satisfy composition for fulfill', () => {
      return Bifunctor.composition(fulfill)(assertSame)({})
    })

    it('should satisfy composition for reject', () => {
      return Bifunctor.composition(reject)(assertSame)(new Error())
    })
  })

  describe('apply', () => {
    it('should satisfy composition', () => {
      return Apply.composition(Promise)(assertSame)({})
    })
  })

  describe('applicative', () => {
    it('should satisfy identity', () => {
      return Applicative.identity(Promise)(assertSame)({})
    })

    it('should satisfy homomorphism', () => {
      return Applicative.homomorphism(Promise)(assertSame)({})
    })

    it('should satisfy interchange', () => {
      return Applicative.interchange(Promise)(assertSame)({})
    })
  })

  describe('chain', () => {
    it('should satisfy associativity', () => {
      return Chain.associativity(Promise)(assertSame)({})
    })
  })

  describe('semigroup', () => {
    it('should satisfy associativity', () => {
      return Semigroup.associativity(fulfill)(assertSame)({})
    })
  })

  describe('monoid', () => {
    it('should satisfy rightIdentity', () => {
      return Monoid.rightIdentity(Promise)(assertSame)({})
    })

    it('should satisfy leftIdentity', () => {
      return Monoid.leftIdentity(Promise)(assertSame)({})
    })
  })

  describe('alt', () => {
    it('should satisfy associativity', () => {
      return Alt.associativity(assertSame)(fulfill(1))(fulfill(2))(fulfill(3))
    })

    it('should satisfy distributivity', () => {
      return Alt.distributivity(assertSame)(fulfill(1))(fulfill(-1))(x => x + 1)
    })
  })

  describe('plus', () => {
    it('should satisfy leftIdentity', () => {
      return Plus.leftIdentity(Promise)(assertSame)(fulfill({}))
    })

    it('should satisfy rightIdentity', () => {
      return Plus.rightIdentity(Promise)(assertSame)(fulfill({}))
    })

    it('should satisfy annihilation', () => {
      return Plus.annihilation(Promise)(assertIsNever)(x => x + 1)
    })
  })

  describe('alternative', () => {
    it('should satisfy distributivity', () => {
      return Alternative.distributivity(p => p.then(x => assert.strictEqual(1, x)))(fulfill(0))(fulfill(x => x + 1))(fulfill(x => x - 1))
    })

    it('should satisfy annihilation', () => {
      return Plus.annihilation(Promise)(assertIsNever)(fulfill({}))
    })
  })
})
