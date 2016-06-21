export default class Handle {
	constructor (ref) {
		this.ref = ref
		this.length = 0
	}
	near () {
		if (this.ref.handle !== this) {
			this.ref = this.ref.near()
		}
		return this.ref
	}
	_add (action) {
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
