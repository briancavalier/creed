'use strict';
import Scheduler from './Scheduler';
import async from './async';
import registerRejection from './registerRejection';
import { PENDING, RESOLVED, FULFILLED, REJECTED, SETTLED, HANDLED } from './state';

let tasks = new Scheduler(async);

export class Promise {
    constructor(handler) {
        this._handler = handler;
    }

    then(f, r) {
        let h = this._handler;
        let s = h.state();

        if(((s & FULFILLED) > 0 && typeof f !== 'function') ||
            ((s & REJECTED) > 0 && typeof r !== 'function')) {
            return new Promise(h);
        }

        let { promise, handler } = defer();
        h.when(new Then(void 0, f, r, handler));
        return promise;
    }

    catch(r) {
        return this.then(null, r);
    }
}

export function defer() {
    let h = new Deferred(tasks);
    return { promise: new Promise(h), handler: h };
}

export function promise(f) {
    return new Promise(new Resolver(f, tasks));
}

export function resolve(x) {
    if(isPromise(x)) {
        return x;
    }

    let handler = getHandler(x);

    return (handler.state() & PENDING) > 0 ? new Promise(handler)
        : new Promise(new Async(handler, tasks));
}

export function reject(x) {
    return new Promise(new Async(new Rejected(x), tasks));
}

export function all(promises) {
    if(typeof promises !== 'object' || promises === null) {
        return reject(new TypeError('non-iterable passed to all()'));
    }

    return new Promise(new All(promises, tasks));
}

export function race(promises) {
    if(typeof promises !== 'object' || promises === null) {
        return reject(new TypeError('non-iterable passed to race()'));
    }

    return promises.length === 0 ? never()
        : new Promise(new Race(promises, tasks));
}

function never() {
    return neverPromise;
}

class Deferred {
    constructor(queue) {
        this.consumers = void 0;
        this.handler = void 0;
        this._state = PENDING;
        this.queue = queue;
    }

    state() {
        return this._state;
    }

    when(action) {
        if (this.isPending()) {
            if (this.consumers === void 0) {
                this.consumers = [action];
            } else {
                this.consumers.push(action);
            }
        } else {
            this.queue.enqueue(new Continuation(action, this.handler));
        }
    }

    join() {
        if (this.isPending()) {
            return this;
        }

        let h = this;

        while (h.handler !== void 0) {
            h = h.handler;
            if (h === this) {
                return this.handler = cycle();
            }
        }

        return h;
    }

    become(handler) {
        if(!this.isPending()) {
            return;
        }

        this._state = RESOLVED;
        this.handler = handler;
        if(this.consumers !== void 0) {
            this.queue.enqueue(this);
        }
    }

    isPending() {
        return (this._state & PENDING) > 0;
    }

    resolve(x) {
        this.become(getHandler(x));
    }

    fulfill(x) {
        this.become(new Fulfilled(x));
    }

    reject(e) {
        if(!this.isPending()) {
            return;
        }

        this.become(new Rejected(e));
    }

    run() {
        let q = this.consumers;
        let handler = this.handler;
        this.handler = this.handler.join();
        this.consumers = void 0;

        for (let i = 0; i < q.length; ++i) {
            handler.when(q[i]);
        }
    }
}

class Resolver extends Deferred {
    constructor(f, queue) {
        super(queue);
        init(f, x => this.resolve(x), e => this.reject(e));
    }
}

function init(f, resolve, reject) {
    try {
        f(resolve, reject);
    } catch (e) {
        reject(e);
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
        action.fulfilled(this);
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
    constructor(then, thenable, queue) {
        super(queue);
        queue.enqueue(new Assimilate(then, thenable, x => this.resolve(x), e => this.reject(e)));
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
    constructor(handler, queue) {
        this.handler = handler;
        this.queue = queue;
    }

    state() {
        return this.join().state();
    }

    when(action) {
        this.queue.enqueue(new Continuation(action, this));
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

// Get a handler for x

function getHandler(x) {
    if(isPromise(x)) {
        return x._handler.join();
    }
    return maybeThenable(x) ? getHandlerUntrusted(x) : new Fulfilled(x);
}

function getHandlerMaybeThenable(x) {
    return isPromise(x) ? x._handler.join() : getHandlerUntrusted(x);
}

function getHandlerUntrusted(x) {
    try {
        let untrustedThen = x.then;
        return typeof untrustedThen === 'function'
            ? new Thenable(untrustedThen, x, tasks)
            : new Fulfilled(x);
    } catch(e) {
        return new Rejected(e);
    }
}

function isPromise(x) {
    return x instanceof Promise;
}

function maybeThenable(x) {
    return (typeof x === 'object' || typeof x === 'function') && x !== null;
}

function cycle() {
    return new Rejected(new TypeError('Promise cycle'));
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

class Then {
    constructor(c, f, r, next) {
        this.c = c;
        this.f = f;
        this.r = r;
        this.next = next;
    }

    fulfilled(handler) {
        runAction(this.c, this.f, handler, this.next);
    }

    rejected(handler) {
        return runAction(this.c, this.r, handler, this.next);
    }
}

function runAction(c, f, handler, next) {
    if(typeof f !== 'function') {
        next.become(handler);
        return false;
    }

    tryCatchNext(c, f, handler.value, next);
    return true;
}

function tryCatchNext(c, f, x, next) {
    try {
        next.resolve(f.call(c, x));
    } catch(e) {
        next.become(new Rejected(e));
    }
}

class All extends Deferred {
    constructor(array, queue) {
        super(queue);
        this.pending = array.length;
        this.resolveAll(array);
    }

    resolveAll(array) {
        let results = new Array(this.pending);

        for(let i = 0, l = array.length; i < l && this.pending > 0; ++i) {
            let x = array[i];

            if(maybeThenable(x)) {
                this.handleAt(results, i, x);
            } else {
                this.fulfillAt(results, i, x);
            }
        }

        this.check(results);
    }

    handleAt(results, i, x) {
        let h = getHandlerMaybeThenable(x);
        let s = h.state();

        if((s & FULFILLED) > 0) {
            this.fulfillAt(results, i, h.value);
        } else if((s & REJECTED) > 0) {
            this.rejectAt(h);
        } else {
            h.when(new SettleAt(this, results, i));
        }
    }

    fulfillAt(results, i, x) {
        results[i] = x;
        this.pending--;
        this.check(results);
    }

    rejectAt(handler) {
        this.pending = 0;
        this.become(handler);
    }

    check(results) {
        if(this.isPending() && this.pending === 0) {
            this.fulfill(results);
        }
    }
}

class SettleAt {
    constructor(all, results, index) {
        this.all = all;
        this.results = results;
        this.index = index;
    }

    fulfilled(handler) {
        this.all.fulfillAt(this.results, this.index, handler.value);
    }

    rejected(handler) {
        this.all.rejectAt(handler);
        return true;
    }
}

class Race extends Deferred {
    constructor(array, queue) {
        super(queue);
        this.resolveRace(array);
    }

    resolveRace(array) {

        for(let i=0, l=array.length; i<l; ++i) {
            let x = array[i];

            if(maybeThenable(x)) {
                let h = getHandlerMaybeThenable(x);
                if((h.state() & SETTLED) > 0) {
                    this.become(h);
                    break;
                }

                h.when(this);
            } else {
                this.fulfill(x);
                break;
            }
        }
    }

    fulfilled(handler) {
        this.become(handler);
    }

    rejected(handler) {
        this.become(handler);
        return true;
    }
}

let neverPromise = new Promise(new Never());

export function lift(f) {
    return function(...args) {
        return applyp(f, this, args);
    }
}

export function join(f, ...args) {
    return applyp(f, this, args);
}

function applyp(f, thisArg, args) {
    let h = new All(args, tasks);

    let { promise, handler } = defer();
    h.when(new Attempt(thisArg, f, handler));
    return promise;
}

class Attempt {
    constructor(c, f, next) {
        this.c = c;
        this.f = f;
        this.next = next;
    }

    fulfilled(handler) {
        try {
            this.next.resolve(this.f.apply(this.c, handler.value));
        } catch(e) {
            this.next.reject(e);
        }
    }

    rejected(handler) {
        return this.next.become(handler);
    }
}

// Node-style async function to promise-returning function
// (a -> (err -> value)) -> (a -> Promise)

export function denodeify(f) {
    return function(...args) {
        return runNode(f, this, args);
    };
}

function runNode(f, thisArg, args) {
    //let handler = new Deferred(tasks);
    let { promise, handler } = defer();

    function settleNode(e, x) {
        if(e) {
            handler.reject(e);
        } else {
            handler.fulfill(x);
        }
    }

    switch(args.length) {
        case 0: f.call(thisArg, settleNode); break;
        case 1: f.call(thisArg, args[0], settleNode); break;
        case 2: f.call(thisArg, args[0], args[1], settleNode); break;
        case 3: f.call(thisArg, args[0], args[1], args[2], settleNode); break;
        default:
            args.push(settleNode);
            f.apply(thisArg, a);
    }

    //return new Promise(handler);
    return promise;
}

// Generator to coroutine
// Generator -> (a -> Promise)

export function task(generator) {
    return function(...args) {
        return runGenerator(generator, this, args);
    };
}

function runGenerator(generator, thisArg, args) {
    return runNext.call(generator.apply(thisArg, args), void 0);
}

function runNext(x) {
    try {
        return handle(this.next(x), this);
    } catch(e) {
        return reject(e);
    }
}

function error(e) {
    try {
        return handle(this.throw(e), this);
    } catch(e) {
        return reject(e);
    }
}

function handle(result, iterator) {
    if(result.done) {
        return result.value;
    }

    let h = getHandler(result.value);
    let s = h.state();

    if((s & FULFILLED) > 0) {
        return runNext.call(iterator, h.value);
    }

    if((s & REJECTED) > 0) {
        return error.call(iterator, h.value);
    }

    let { promise, handler } = defer();
    h.when(new Then(iterator, runNext, error, handler));
    return promise;
}

(function(TruthPromise, Resolver, resolve, reject, all, race, queue) {

    var g;
    if(typeof self !== 'undefined') {
        g = self;
    } else if(typeof global !== 'undefined') {
        g = global;
    } else {
        return;
    }

    if(typeof g.Promise !== 'function') {
        g.Promise = class Promise extends TruthPromise {
            constructor(f) {
                super(new Resolver(f, queue));
            }
        };

        Promise.resolve = resolve;
        Promise.reject  = reject;
        Promise.all     = all;
        Promise.race    = race;
    }

}(Promise, Resolver, resolve, reject, all, race, tasks));

//function visitRemaining(promises, start, handler) {
//    let unreport = new Unreport();
//
//    for(let i=start; i<promises.length; ++i) {
//        let h = getHandler(promises[i]);
//
//        if (h !== handler && (h.state() & FULFILLED) === 0) {
//            h.when(unreport);
//        }
//    }
//}
//
//class Unreport {
//    fulfilled() {}
//
//    rejected(handler) {
//        handler.unreport();
//    }
//}