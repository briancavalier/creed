import { describe, it } from 'mocha'
import { runNode, all } from '../src/main'
import assert from 'assert'

function runFn (...args) {
	return runNode((...args) => {
		let last = args.length - 1
		let cb = args[last]
		let a = args.slice(0, last)

		cb(null, a.reduce(append))
	}, ...args)
}

const append = (a, b) => a + b

describe('run', function () {
	it('should fulfill on success', () => {
		let expected = {}
		return runNode((a, cb) => cb(null, a), expected)
			.then(x => assert.strictEqual(x, expected))
	})

	it('should reject on failure', () => {
		let expected = new Error()
		return runNode((a, cb) => cb(a), expected)
			.then(assert.ifError, e => assert.strictEqual(e, expected))
	})

	it('should reject if function throws synchronously', () => {
		let expected = new Error()
		return runNode(a => { throw a }, expected)
			.then(assert.ifError, e => assert.strictEqual(e, expected))
	})

	it('should accept zero args', () => {
		return runNode(cb => cb(null, true)).then(assert)
	})

	it('should accept multiple args', () => {
		let eq = a => b => assert.equal(a, b)
		let a = []

		a.push(runFn('a').then(eq('a')))
		a.push(runFn('a', 'b').then(eq('ab')))
		a.push(runFn('a', 'b', 'c').then(eq('abc')))
		a.push(runFn('a', 'b', 'c', 'd').then(eq('abcd')))
		a.push(runFn('a', 'b', 'c', 'd', 'e').then(eq('abcde')))

		return all(a)
	})
})
