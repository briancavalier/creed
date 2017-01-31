import { describe, it } from 'mocha'
import { runNode, all } from '../src/main'
import { is, eq, assert, fail } from '@briancavalier/assert'
import { rejectsWith } from './lib/test-util'

function runFn (...args) {
	return runNode(function(...args) {
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
			.then(is(expected))
	})

	it('should reject on failure', () => {
		let expected = new Error()
		return rejectsWith(is(expected), runNode((a, cb) => cb(a), expected))
	})

	it('should reject if function throws synchronously', () => {
		let expected = new Error()
		return rejectsWith(is(expected), runNode(a => { throw a }, expected))
	})

	it('should accept zero args', () => {
		return runNode(cb => cb(null, true)).then(assert)
	})

	it('should accept multiple args', () => {
		const a = []

		a.push(runFn('a').then(eq('a')))
		a.push(runFn('a', 'b').then(eq('ab')))
		a.push(runFn('a', 'b', 'c').then(eq('abc')))
		a.push(runFn('a', 'b', 'c', 'd').then(eq('abcd')))
		a.push(runFn('a', 'b', 'c', 'd', 'e').then(eq('abcde')))

		return all(a)
	})
})
