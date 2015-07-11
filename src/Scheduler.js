export default class Scheduler {
	constructor(makeAsync) {
		this.length = 0;
		this._makeAsync = makeAsync;
	}

	add(task) {
		if (this.length === 0) {
			this.drain();
		}

		this[this.length++] = task;
	}

	drain() {
		this.drain = this._makeAsync(() => this._drain());
		this.drain();
	}

	_drain() {
		for (let i = 0; i < this.length; ++i) {
			this[i].run();
			this[i] = void 0;
		}

		this.length = 0;
	};
}


