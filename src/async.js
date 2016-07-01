import { isNode, MutationObs } from './env'

/* global process,document */

const createScheduler = isNode ? createNodeScheduler /* istanbul ignore next */
	: MutationObs ? createBrowserScheduler
	: createFallbackScheduler

export { createScheduler as default }

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
