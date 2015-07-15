/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

import { isNode, MutationObs } from './env';

/*global process,document */

export default function createScheduler(f) {
    //jscs:disable validateIndentation
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
    let node = document.createTextNode('');
    (new MutationObs(f)).observe(node, { characterData: true });

    let i = 0;
    return () => node.data = (i ^= 1);
}
