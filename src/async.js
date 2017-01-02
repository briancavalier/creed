import { isNode, MutationObs } from './env'

/* global process,document */

export default function (f) {
	return isNode ? createNodeScheduler(f) /* istanbul ignore next */
		: MutationObs ? createBrowserScheduler(f)
		: createFallbackScheduler(f)
}

/* istanbul ignore next */
function createFallbackScheduler (f) {
	return () => setTimeout(f, 0)
}

function createNodeScheduler (f) {
	return () => process.nextTick(f)
}

/* istanbul ignore next */
function createBrowserScheduler (f) {
	const node = document.createTextNode('')
	new MutationObs(f).observe(node, { characterData: true })

	let i = 0
	return () => { node.data = (i ^= 1) }
}
