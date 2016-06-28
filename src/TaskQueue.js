import makeAsync from './async'

export class TaskQueue {
	constructor () {
		this.tasks = new Array(2 << 15)
		this.length = 0
		this.drain = makeAsync(() => this._drain())
	}

	add (task) {
		if (this.length === 0) {
			this.drain()
		}

		this.tasks[this.length++] = task
	}

	_drain () {
		const q = this.tasks
		for (let i = 0; i < this.length; ++i) {
			q[i].run()
			q[i] = void 0
		}
		this.length = 0
	}
}

// make an Action runnable on a Promise
export class Continuation {
	constructor (action, promise) {
		this.action = action
		this.promise = promise
	}

	run () {
		if (this.action.promise) this.promise._runAction(this.action)
	}
}
