export default function runPromise (f, thisArg, args, promise) {
	/* eslint complexity:[2,5] */
	function resolve (x) {
		promise._resolve(x)
	}

	function reject (e) {
		promise._reject(e)
	}

	switch (args.length) {
		case 0:
			f.call(thisArg, resolve, reject)
			break
		case 1:
			f.call(thisArg, args[0], resolve, reject)
			break
		case 2:
			f.call(thisArg, args[0], args[1], resolve, reject)
			break
		case 3:
			f.call(thisArg, args[0], args[1], args[2], resolve, reject)
			break
		default:
			args.push(resolve, reject)
			f.apply(thisArg, args)
	}

	return promise
}
