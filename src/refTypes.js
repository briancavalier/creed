'use strict';
import maybeThenable from './maybeThenable';
import { PENDING, RESOLVED, FULFILLED, REJECTED, SETTLED, HANDLED } from './state';

export function isPending(ref) {
    return (ref.state() & PENDING) > 0;
}

export function isFulfilled(ref) {
    return (ref.state() & FULFILLED) > 0;
}

export function isRejected(ref) {
    return (ref.state() & REJECTED) > 0;
}

export function getValue(ref) {
    if(!isFulfilled(ref)) {
        throw new TypeError('not fulfilled');
    }

    return ref.value;
}

export function getReason(ref) {
    if(!isRejected(ref)) {
        throw new TypeError('not rejected');
    }

    return ref.value;
}

export function makeRefTypes(isPromise, handlerForPromise, registerRejection, taskQueue) {

    class Deferred {
        constructor() {
            this.consumers = void 0;
            this.handler = void 0;
            this._state = PENDING;
        }

        state() {
            return this._state;
        }

        when(action) {
            if (isPending(this)) {
                if (this.consumers === void 0) {
                    this.consumers = [action];
                } else {
                    this.consumers.push(action);
                }
            } else {
                taskQueue.enqueue(new Continuation(action, this.handler));
            }
        }

        join() {
            if (isPending(this)) {
                return this;
            }

            let h = this;

            while (h.handler !== void 0) {
                h = h.handler;
                if (h === this) {
                    return this.handler = cycle();
                }
            }

            return this.handler = h;
        }

        become(handler) {
            if(!isPending(this)) {
                return;
            }

            this._state = RESOLVED;
            this.handler = handler;
            if(this.consumers !== void 0) {
                taskQueue.enqueue(this);
            }
        }

        resolve(x) {
            this.become(handlerFor(x));
        }

        fulfill(x) {
            this.become(new Fulfilled(x));
        }

        reject(e) {
            if(!isPending(this)) {
                return;
            }

            this.become(new Rejected(e));
        }

        run() {
            let q = this.consumers;
            let handler = this.handler = this.handler.join();
            this.consumers = void 0;

            for (let i = 0; i < q.length; ++i) {
                handler.when(q[i]);
            }
        }
    }

    class Fulfilled {
        constructor(x) {
            this.value = x;
        }

        state() {
            return FULFILLED;
        }

        when(action) {
            return action.fulfilled(this);
        }

        join() {
            return this;
        }

        become() {}
    }

    class Rejected {
        constructor(e) {
            this.value = e;
            this._state = REJECTED;
            registerRejection(this);
        }

        state() {
            return this._state;
        }

        when(action) {
            if(action.rejected(this)) {
                this._state |= HANDLED;
            }
        }

        join() {
            return this;
        }

        become() {}
    }

    class Thenable extends Deferred {
        constructor(then, thenable) {
            super();
            taskQueue.enqueue(new Assimilate(then, thenable, x => this.resolve(x), e => this.reject(e)));
        }
    }

    class Assimilate {
        constructor(then, thenable, resolve, reject) {
            this._then = then;
            this.thenable = thenable;
            this.resolve = resolve;
            this.reject = reject;
        }

        run() {
            try {
                this._then.call(this.thenable, this.resolve, this.reject);
            } catch (e) {
                this.reject(e);
            }
        }
    }

    class Async {
        constructor(handler) {
            this.handler = handler;
        }

        state() {
            return this.join().state();
        }

        when(action) {
            taskQueue.enqueue(new Continuation(action, this));
        }

        join() {
            let h = this;
            while(h.handler !== void 0) {
                h = h.handler;
            }
            return h;
        }

        become() {}
    }

    class Never {
        constructor() {}

        state() {
            return PENDING;
        }

        when() {}

        join() {
            return this;
        }

        become() {}
    }

    return {
        handlerFor, handlerForMaybeThenable,
        Deferred, Fulfilled, Rejected, Async, Never
    };

    function handlerFor(x) {
        if(isPromise(x)) {
            return handlerForPromise(x).join();
        }
        return maybeThenable(x) ? handleForUntrusted(x) : new Fulfilled(x);
    }

    function handlerForMaybeThenable(x) {
        return isPromise(x) ? handlerForPromise(x).join() : handleForUntrusted(x);
    }

    function handleForUntrusted(x) {
        try {
            let then = x.then;
            return typeof then === 'function' ? new Thenable(then, x) : new Fulfilled(x);
        } catch(e) {
            return new Rejected(e);
        }
    }

    function cycle() {
        return new Rejected(new TypeError('resolution cycle'));
    }
}

class Continuation {
    constructor(action, handler) {
        this.action = action;
        this.handler = handler;
    }

    run() {
        this.handler.join().when(this.action);
    }
}
