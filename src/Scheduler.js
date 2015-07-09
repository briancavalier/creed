export default class Scheduler {
	constructor(async) {
		this._async = async;
		this.length = 0;

		this.drain = () => this._drain();
	}

	add(task) {
		if (this.length === 0) {
			this._async(this.drain);
		}

		this[this.length++] = task;
	}

	_drain() {
		for (let i = 0; i < this.length; ++i) {
			this[i].run();
			this[i] = void 0;
		}

		this.length = 0;
	};
}


