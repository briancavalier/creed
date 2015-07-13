'use strict';
import maybeThenable from './maybeThenable';
import { PENDING, RESOLVED, FULFILLED, REJECTED } from './state';
import { silenceError } from './inspect';

export default function makeRefTypes(isPromise, refForPromise, errorHandler, taskQueue) {

    class Deferred {
        constructor() {
            this.ref = void 0;
            this.action = void 0;
            this.length = 0;
        }

        state() {
            return this.isResolved() ? this.ref.join().state() : PENDING;
        }

        isResolved() {
            return this.ref !== void 0;
        }

        when(action) {
            this.asap(action);
        }

        asap(action) {
            if(this.action === void 0) {
                this.action = action;
                if(this.isResolved()) {
                    taskQueue.add(this);
                }
            } else {
                this[this.length++] = action;
            }
        }

        join() {
            return this.isResolved() ? this._join() : this;
        }

        _join() {
            let ref = this;

            while(ref.ref !== void 0) {
                ref = ref.ref;
                if(ref === this) {
                    ref = cycle();
                    break;
                }
            }

            return this.ref = ref;
        }

        resolve(x) {
            this.become(refFor(x));
        }

        fulfill(x) {
            this.become(new Fulfilled(x));
        }

        reject(e) {
            if(this.isResolved()) {
                return;
            }

            this._become(new Rejected(e));
        }

        become(ref) {
            if(this.isResolved()) {
                return;
            }

            this._become(ref);
        }

        _become(ref) {
            this.ref = ref;
            if(this.action !== void 0) {
                taskQueue.add(this);
            }
        }

        run() {
            let ref = this.ref.join();
            ref.asap(this.action);
            this.action = void 0;

            for (let i = 0; i < this.length; ++i) {
                ref.asap(this[i]);
                this[i] = void 0;
            }
        }
    }

    class Resolved {
        constructor(x) {
            this.ref = void 0;
            this.value = x;
        }

        state() {
            return this.join().state();
        }

        join() {
            if(this.ref === void 0) {
                this.ref = maybeThenable(this.value) ? refForUntrusted(this.value) : new Fulfilled(this.value);
                this.value = void 0;
            }
            return this.ref = this.ref.join();
        }

        asap(action) {
            return this.join().asap(action);
        }

        when(action) {
            return this.join().when(action);
        }
    }

    class Fulfilled {
        constructor(x) {
            this.value = x;
        }

        state() {
            return FULFILLED;
        }

        asap(action) {
            action.fulfilled(this);
        }

        when(action) {
            taskQueue.add(new Continuation(action, this));
        }

        join() {
            return this;
        }
    }

    class Rejected {
        constructor(e) {
            this.value = e;
            errorHandler.track(this);
        }

        state() {
            return REJECTED;
        }

        asap(action) {
            if(action.rejected(this)) {
                errorHandler.untrack(this);
            }
        }

        when(action) {
            taskQueue.add(new Continuation(action, this));
        }

        join() {
            return this;
        }
    }

    class Never {
        state() {
            return PENDING;
        }

        asap() {}

        when() {}

        join() {
            return this;
        }
    }

    class Continuation {
        constructor(action, ref) {
            this.action = action;
            this.ref = ref;
        }

        run() {
            this.ref.asap(this.action);
        }
    }

    return {
        refFor, Deferred, Resolved, Fulfilled, Rejected, Never
    };

    function refFor(x) {
        return isPromise(x) ? refForPromise(x).join() : new Resolved(x);
    }

    function refForUntrusted(x) {
        try {
            let then = x.then;
            return typeof then === 'function' ? extractThenable(then, x) : new Fulfilled(x);
        } catch(e) {
            return new Rejected(e);
        }
    }

    function extractThenable(then, thenable) {
        let d = new Deferred();
        try {
            then.call(thenable, x => d.resolve(x), e => d.reject(e));
        } catch (e) {
            d.reject(e);
        }

        return d;
    }

    function cycle() {
        return new Rejected(new TypeError('resolution cycle'));
    }
}
