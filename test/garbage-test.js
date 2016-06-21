import { describe, it } from 'mocha'
import assert from 'assert'

import { resolve, reject, fulfill, never } from '../src/main'
import getCounts, { collect, formatResults, sumResults } from './lib/refcount-util'

describe('reference counts', () => {
	const C = 3
	const len = C*C*C
	it('should be constant for recursive resolving with no handler', () => {
		return getCounts(delay => {
			// return delay(1).chain( ()=>delay(2).chain( ()=>delay(3) ) )
			function recurse(i) {
				return i < len ? delay(i+1).chain(recurse) : fulfill()
			}
			return recurse(1)
		}, (na, ev, co) => sumResults(co)).then(logs => { for (let sum of logs) assert(sum <= C+5, sum+"<="+(C+5)) })
	})
	it('should be constant for recursive resolving with a result', () => {
		return getCounts(delay => {
			// return delay(1).chain( ()=>delay(2).chain( ()=>delay(3) ) ).map(l => 3-l)
			function recurse(i) {
				return i < len ? delay(i+1).chain(recurse) : fulfill(i)
			}
			return recurse(1).map(l => len - l)
		}, (na, ev, co) => sumResults(co)).then(logs => { for (let sum of logs) assert(sum <= C+6, sum+"<="+(C+6)) })
	})
	it('should be constant for recursive resolving with a late handler', () => {
		return getCounts((delay, timeout) => {
			// p = delay(1).chain( ()=>delay(2).chain( ()=>delay(3) ) )
			// largeDelay().then(() => p.map(l => 3-l))
			function recurse(i) {
				if (i < len) return delay(i+1).chain(recurse)
				timeout(i+1, () => p.map(l => len - l))
				return fulfill(i)
			}
			var p = recurse(1)
			return p
		}, (na, ev, co) => sumResults(co)).then(logs => { for (let sum of logs) assert(sum <= C+5, sum+"<="+(C+5)) })
	})
	it('should be not more than linear for recursive resolving with many handlers', () => {
		return getCounts(delay => {
			function recurse(i) {
				if (i>1) p.map(l => len - l)
				return i < len ? delay(i+1).chain(recurse) : fulfill(i)
			}
			var p = recurse(1)
			return p
		}, (na, ev, co) => [na, co.Futures, co.Maps, sumResults(co)]).then(logs => {
			for (let [i, f, m, sum] of logs) {
				assert(f <= C+i, f+"<="+(C+i)+" Futures") // 1 Future result per handler
				assert(m <= C+i, m+"<="+(C+i)+" Maps") // 1 Map action per handler
				sum -= f + m
				assert(sum <= C+5, sum+"<="+(C+5)+" others")
			}
		})
	})
	it('should be constant for recursive resolving with many late handlers', () => {
		return getCounts((delay, timeout) => {
			// p = delay(1).chain( ()=>delay(2).chain( ()=>delay(3) ) )
			// largeDelay().then(() => { p.map(l => 3-l); p.map(l => 3-l); p.map(l => 3-l); })
			function recurse(i) {
				if (i < len) return delay(i+1).chain(recurse)
				timeout(i+1, () => { for (var j=0; j<len/2; j++) p.map(l => len - l) }) // dropping the results
				return fulfill(i)
			}
			var p = recurse(1)
			return p
		}, (na, ev, co) => sumResults(co)).then(logs => { for (let sum of logs) assert(sum <= C+5, sum+"<="+(C+5)) })
	})
	
	/*
	function log (na, ev, co) {
		console.log("\t"+na+" - "+ev+" ["+formatResults(co)+"]")
	}
	it('should be interesting1', () => {
		return getCounts(delay => {
			return delay(1).chain(()=>delay(2)).chain(()=>delay(3))
		}, log)
	})
	it('should be interesting2', () => {
		return getCounts(delay => {
			return delay(1).chain(()=>delay(2).chain(()=>delay(3).chain(()=>delay(4).chain(()=>delay(5)))))
		}, log)
	})
	it('should be interesting3', () => {
		return getCounts(delay => {
			return delay(delay(delay(0, 1), 2), 3)
		}, log)
	})
	*/
})
