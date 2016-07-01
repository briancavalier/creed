// isObject :: * -> boolean
export function isObject (x) {
	return (typeof x === 'object' || typeof x === 'function') && x !== null
}

/* istanbul ignore next */
export function noop () {}
