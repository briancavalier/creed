/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

import isNode from './isNode';
/*global process,document,MutationObserver,WebKitMutationObserver*/

export default function async(f) {
	return runAsync(f);
};

var runAsync = function (f) { return setTimeout(f, 0); };

var MutationObs;

// Detect specific env
if (isNode()) { // Node
	runAsync = function (f) { return process.nextTick(f); };
} else if (MutationObs = hasMutationObserver()) { // Modern browser
	runAsync = initMutationObserver(MutationObs);
}

function hasMutationObserver () {
	return (typeof MutationObserver === 'function' && MutationObserver) ||
		(typeof WebKitMutationObserver === 'function' && WebKitMutationObserver);
}

function initMutationObserver(MutationObserver) {
	var scheduled;
	var node = document.createTextNode('');
	var o = new MutationObserver(run);
	o.observe(node, { characterData: true });

	function run() {
		var f = scheduled;
		scheduled = void 0;
		f();
	}

	var i = 0;
	return function (f) {
		scheduled = f;
		node.data = (i ^= 1);
	};
}
