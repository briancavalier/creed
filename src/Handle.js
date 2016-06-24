export class Handle {
	constructor (ref) {
		this.ref = ref
	}
	near () {
		if (this.ref.handle !== this) {
			this.ref = this.ref.near()
		}
		return this.ref
	}
	// the ref will be lost, e.g. when an action is used multiple times
	_isReused () {
		return false // ref is stable by default
	}
}

export class ShareHandle extends Handle {
	constructor (ref) {
		// assert: ref != null
		super(ref)
		this.length = 0
	}
	_concat (action) {
		action.ref = this // a ShareHandle is not a Promise with a .handle, but .near() is enough
		this[this.length++] = action
		// potential for flattening the tree here
		return this
	}
	run () {
		for (let i = 0; i < this.length; ++i) {
			this.ref._runAction(this[i])
			this[i] = void 0
		}
		this.length = 0
	}
}
