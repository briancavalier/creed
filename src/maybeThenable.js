// maybeThenable :: * -> boolean
export default function maybeThenable (x) {
	return (typeof x === 'object' || typeof x === 'function') && x !== null
}
