'use strict';
import maybeThenable from './maybeThenable';
import { PENDING, RESOLVED, FULFILLED, REJECTED, HANDLED } from './state';

export function isPending(ref) {
    return (ref.state() & PENDING) > 0;
}

export function isFulfilled(ref) {
    return (ref.state() & FULFILLED) > 0;
}

export function isRejected(ref) {
    return (ref.state() & REJECTED) > 0;
}

export function isSettled(ref) {
    return isFulfilled(ref) || isRejected(ref);
}

export function getValue(ref) {
    if(!isFulfilled(ref)) {
        throw new TypeError('not fulfilled');
    }

    return ref.join().value;
}

export function getReason(ref) {
    if(!isRejected(ref)) {
        throw new TypeError('not rejected');
    }

    return ref.join().value;
}

export function makeRefTypes(isPromise, handlerForPromise, registerRejection, taskQueue) {

    class Deferred {
        constructor() {
            this.consumers = void 0;
            this.handler = void 0;
            this._state = PENDING;
        }

        state() {
            return this.isResolved() ? this.handler.join().state() : this._state;
        }

        when(action) {
            if (this.isResolved(this)) {
                taskQueue.enqueue(new Continuation(action, this.handler));
                return;
            }

            if (this.consumers === void 0) {
                this.consumers = [action];
            } else {
                this.consumers.push(action);
            }
        }

        join() {
            if (!this.isResolved(this)) {
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
            if(this.isResolved()) {
                return;
            }

            this._state |= RESOLVED;
            this.handler = handler;
            if(this.consumers !== void 0) {
                taskQueue.enqueue(this);
            }
        }

        isResolved() {
            return (this._state & RESOLVED) > 0;
        }

        resolve(x) {
            this.become(handlerFor(x));
        }

        fulfill(x) {
            this.become(new Fulfilled(x));
        }

        reject(e) {
            if(this.isResolved()) {
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
    }

    function extract(then, thenable) {
        let d = new Deferred();
        taskQueue.enqueue(new Assimilate(then, thenable, x => d.resolve(x), e => d.reject(e)));
        return d;
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
            return typeof then === 'function' ? extract(then, x) : new Fulfilled(x);
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
