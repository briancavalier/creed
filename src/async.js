/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

import { isNode, MutationObs } from './env';

/*global process,document */

export default function createScheduler(f) {
	return isNode ? createNodeScheduler(f)
		: MutationObs ? createBrowserScheduler(f)
		: createFallbackScheduler(f);
}

function createFallbackScheduler(f) {
	return () => setTimeout(f, 0);
}

function createNodeScheduler(f) {
	return () => process.nextTick(f);
}

function createBrowserScheduler(f) {
	return () => {
		let div = document.createElement('div');
		(new MutationObs(f)).observe(div, { characterData: true });

		return () => div.data = (i ^= 1);
	};
}