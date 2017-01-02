export default function runNode (f, thisArg, args, promise) {
	/* eslint complexity:[2,5] */
	function settleNode (e, x) {
		if (e) {
			promise._reject(e)
		} else {
			promise._fulfill(x)
		}
	}

	switch (args.length) {
		case 0:
			f.call(thisArg, settleNode)
			break
		case 1:
			f.call(thisArg, args[0], settleNode)
			break
		case 2:
			f.call(thisArg, args[0], args[1], settleNode)
			break
		case 3:
			f.call(thisArg, args[0], args[1], args[2], settleNode)
			break
		default:
			args.push(settleNode)
			f.apply(thisArg, args)
	}

	return promise
}
