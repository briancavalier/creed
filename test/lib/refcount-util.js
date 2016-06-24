import { resolve, isRejected, isNever } from '../../src/main'
import { Future } from '../../src/Promise'
import Action from '../../src/Action'

const knownNames = ['Handle', 'Action',
	'Then', 'Chain', 'Map', 'Delay',
	'Future', 'Fulfilled', 'Rejected',
	'Settle', 'Merge', 'Any', 'Race']
const DELAY_TIME = 5

export default function getCounts(exec, report, targets = knownNames, withResult = false) {
	function asyncReport(x) {
		timeoutCount++
		setTimeout(() => {
			res.push(report(x, 'result after', collect([result], targets, seenBefore)))
			if (globals.size > +withResult) res.push(report(x, 'globals after', collect(globals, targets, seenBefore)))
			if (--timeoutCount == 0) promise._fulfill(res)
		}, 2) // after the TaskQueue is drained
	}
	function monitoredTimeout(log, fn, captures = []) {
		for (let c of captures)
			globals.add(c)
		timeoutCount++
		setTimeout(() => {
			for (let c of captures)
				globals.delete(c)
			if (captures.length) res.push(report(log, 'captures from timeout', collect(captures, targets, seenBefore)))
			res.push(report(log, 'result before', collect([result], targets, seenBefore)))
			if (globals.size > +withResult) res.push(report(log, 'globals before', collect(globals, targets, seenBefore)))
			fn()
			asyncReport(log)
			if (--timeoutCount == 0) promise._fulfill(res)
		}, DELAY_TIME)
	}
	function monitoredDelay (x, id) {
		const p = resolve(x)
		if (isRejected(p) || isNever(p)) {
			return p
		} else {
			var promise = new Future()
			p._runAction(new Delay(promise, id))
			return promise
		}
	}
	class Delay extends Action {
		constructor (promise, id) {
			super(promise)
			this.id = id
		}

		fulfilled (p) {
			monitoredTimeout(this.id || p.value, () => this.promise._become(p), [this.promise, p])
		}
	}
	
	const promise = new Future
	var timeoutCount = 0
	const res = []
	const seenBefore = new WeakSet
	const globals = new Set
	const result = exec(monitoredDelay, monitoredTimeout);
	if (withResult) {
		globals.add(result)
	}
	asyncReport(0) // 'init'
	return promise
}

export function collect(sources, targets = knownNames, seenBefore = new WeakSet) {
	var seenHere = new Set([])
	function test(o) {
		if (seenHere.has(o)) return
		seenHere.add(o)

		for (let property in o) {
			let value = o[property]
			if (value && typeof value == 'object') { // ignore function objects
				test(value)
			}
		}
	}
	for (let source of sources) {
		test(source)
	}

	var counts = {}
	for (let name of targets) {
		counts[name+'s'] = 0
		counts['new'+name+'s'] = 0
	}
	for (let o of seenHere) {
		const name = o.constructor.name
		if (targets.includes(name)) {
			counts[name+'s']++
			if (!seenBefore.has(o)) {
				seenBefore.add(o)
				counts['new'+name+'s']++
			}
		} else {
			console.log('unknown kind "'+name+'":', o)
		}
	}
	return counts
}
export function formatResults(counts) {
	var x = []
	for (let name in counts) {
		if (counts[name] == 0) continue
		if (/^new/.test(name)) continue
		let r = name+': '+counts[name]
		if (counts['new'+name] > 0)
			r += ' (+'+counts['new'+name]+')'
		x.push(r)
	}
	return x.join(', ')
}

export function sumResults(counts) {
	var c = 0;
	for (let name in counts)
		if (!/^new/.test(name))
			c += counts[name]
	return c
}