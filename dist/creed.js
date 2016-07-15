(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.creed = global.creed || {})));
}(this, function (exports) { 'use strict';

    /*eslint no-multi-spaces: 0*/
    var PENDING   = 1 << 0
    var FULFILLED = 1 << 1
    var REJECTED  = 1 << 2
    var SETTLED   = FULFILLED | REJECTED
    var NEVER     = 1 << 3

    var HANDLED   = 1 << 4

    function isPending (p) {
    	return (p.state() & PENDING) > 0
    }

    function isFulfilled (p) {
    	return (p.state() & FULFILLED) > 0
    }

    function isRejected (p) {
    	return (p.state() & REJECTED) > 0
    }

    function isSettled (p) {
    	return (p.state() & SETTLED) > 0
    }

    function isNever (p) {
    	return (p.state() & NEVER) > 0
    }

    function isHandled (p) {
    	return (p.state() & HANDLED) > 0
    }

    function getValue (p) {
    	var n = p.near()
    	if (!isFulfilled(n)) {
    		throw new TypeError('getValue called on ' + p)
    	}

    	return n.value
    }

    function getReason (p) {
    	var n = p.near()
    	if (!isRejected(n)) {
    		throw new TypeError('getReason called on ' + p)
    	}

    	silenceError(n)
    	return n.value
    }

    function silenceError (p) {
    	p._runAction(silencer)
    }

    var silencer = {
    	fulfilled: function fulfilled () {},
    	rejected: setHandled
    }

    function setHandled (rejected) {
    	rejected._state |= HANDLED
    }

    /*global process,MutationObserver,WebKitMutationObserver */

    var isNode = typeof process !== 'undefined' &&
        Object.prototype.toString.call(process) === '[object process]'

    /* istanbul ignore next */
    var MutationObs = (typeof MutationObserver === 'function' && MutationObserver) ||
        (typeof WebKitMutationObserver === 'function' && WebKitMutationObserver)

    /* global process,document */

    function makeAsync (f) {
    	return isNode ? createNodeScheduler(f) /* istanbul ignore next */
    		: MutationObs ? createBrowserScheduler(f)
    		: createFallbackScheduler(f)
    }

    /* istanbul ignore next */
    function createFallbackScheduler (f) {
    	return function () { return setTimeout(f, 0); }
    }

    function createNodeScheduler (f) {
    	return function () { return process.nextTick(f); }
    }

    /* istanbul ignore next */
    function createBrowserScheduler (f) {
    	var node = document.createTextNode('')
    	new MutationObs(f).observe(node, { characterData: true })

    	var i = 0
    	return function () { node.data = (i ^= 1) }
    }

    var TaskQueue = function TaskQueue () {
    	var this$1 = this;

    	this.tasks = new Array(2 << 15)
    	this.length = 0
    	this.drain = makeAsync(function () { return this$1._drain(); })
    };

    TaskQueue.prototype.add = function add (task) {
    	if (this.length === 0) {
    		this.drain()
    	}

    	this.tasks[this.length++] = task
    };

    TaskQueue.prototype._drain = function _drain () {
    	var q = this.tasks
    	for (var i = 0; i < this.length; ++i) {
    		q[i].run()
    		q[i] = void 0
    	}
    	this.length = 0
    };

    var UNHANDLED_REJECTION = 'unhandledRejection'
    var HANDLED_REJECTION = 'rejectionHandled'

    var ErrorHandler = function ErrorHandler (emitEvent, reportError) {
    	this.errors = []
    	this.emit = emitEvent
    	this.reportError = reportError
    };

    ErrorHandler.prototype.track = function track (e) {
    	if (!this.emit(UNHANDLED_REJECTION, e, e.value)) {
    		/* istanbul ignore else */
    		if (this.errors.length === 0) {
    			setTimeout(reportErrors, 1, this.reportError, this.errors)
    		}
    		this.errors.push(e)
    	}
    };

    ErrorHandler.prototype.untrack = function untrack (e) {
    	silenceError(e)
    	this.emit(HANDLED_REJECTION, e)
    };

    function reportErrors (report, errors) {
    	try {
    		reportAll(errors, report)
    	} finally {
    		errors.length = 0
    	}
    }

    function reportAll (errors, report) {
    	for (var i = 0; i < errors.length; ++i) {
    		var e = errors[i]
    		/* istanbul ignore else */
    		if (!isHandled(e)) {
    			report(e)
    		}
    	}
    }

    var UNHANDLED_REJECTION$1 = 'unhandledRejection'

    function makeEmitError () {
    	/*global process, self, CustomEvent*/
    	// istanbul ignore else */
    	if (isNode && typeof process.emit === 'function') {
    		// Returning falsy here means to call the default reportRejection API.
    		// This is safe even in browserify since process.emit always returns
    		// falsy in browserify:
    		// https://github.com/defunctzombie/node-process/blob/master/browser.js#L40-L46
    		return function (type, error) {
    			return type === UNHANDLED_REJECTION$1
    				? process.emit(type, error.value, error)
    				: process.emit(type, error)
    		}
    	} else if (typeof self !== 'undefined' && typeof CustomEvent === 'function') {
    		return (function (noop, self, CustomEvent) {
    			var hasCustomEvent
    			try {
    				hasCustomEvent = new CustomEvent(UNHANDLED_REJECTION$1) instanceof CustomEvent
    			} catch (e) {
    				hasCustomEvent = false
    			}

    			return !hasCustomEvent ? noop : function (type, error) {
    				var ev = new CustomEvent(type, {
    					detail: {
    						reason: error.value,
    						promise: error
    					},
    					bubbles: false,
    					cancelable: true
    				})

    				return !self.dispatchEvent(ev)
    			}
    		}(noop, self, CustomEvent))
    	}

    	// istanbul ignore next */
    	return noop
    }

    // istanbul ignore next */
    function noop () {}

    // maybeThenable :: * -> boolean
    function maybeThenable (x) {
    	return (typeof x === 'object' || typeof x === 'function') && x !== null
    }

    function then (f, r, p, promise) {
    	p._when(new Then(f, r, promise))
    	return promise
    }

    var Then = function Then (f, r, promise) {
    	this.f = f
    	this.r = r
    	this.promise = promise
    };

    Then.prototype.fulfilled = function fulfilled (p) {
    	runThen(this.f, p, this.promise)
    };

    Then.prototype.rejected = function rejected (p) {
    	return runThen(this.r, p, this.promise)
    };

    function runThen (f, p, promise) {
    	if (typeof f !== 'function') {
    		promise._become(p)
    		return false
    	}

    	tryMapNext(f, p.value, promise)
    	return true
    }

    function tryMapNext (f, x, promise) {
    	try {
    		promise._resolve(f(x))
    	} catch (e) {
    		promise._reject(e)
    	}
    }

    function map (f, p, promise) {
    	p._when(new Map(f, promise))
    	return promise
    }

    var Map = function Map (f, promise) {
    	this.f = f
    	this.promise = promise
    };

    Map.prototype.fulfilled = function fulfilled (p) {
    	try {
    		var f = this.f
    		this.promise._fulfill(f(p.value))
    	} catch (e) {
    		this.promise._reject(e)
    	}
    };

    Map.prototype.rejected = function rejected (p) {
    	this.promise._become(p)
    };

    function chain (f, p, promise) {
    	p._when(new Chain(f, promise))
    	return promise
    }

    var Chain = function Chain (f, promise) {
    	this.f = f
    	this.promise = promise
    };

    Chain.prototype.fulfilled = function fulfilled (p) {
    	try {
    		runChain(this.f, p.value, this.promise)
    	} catch (e) {
    		this.promise._reject(e)
    	}
    };

    Chain.prototype.rejected = function rejected (p) {
    	this.promise._become(p)
    };

    function runChain (f, x, p) {
    	var y = f(x)
    	if (!(maybeThenable(y) && typeof y.then === 'function')) {
    		throw new TypeError('f must return a promise')
    	}

    	p._resolve(y)
    }

    var Race = function Race (never) {
    	this.never = never
    };

    Race.prototype.valueAt = function valueAt (x, i, promise) {
    	promise._fulfill(x)
    };

    Race.prototype.fulfillAt = function fulfillAt (p, i, promise) {
    	promise._become(p)
    };

    Race.prototype.rejectAt = function rejectAt (p, i, promise) {
    	promise._become(p)
    };

    Race.prototype.complete = function complete (total, promise) {
    	if (total === 0) {
    		promise._become(this.never())
    	}
    };

    var Merge = function Merge (mergeHandler, results) {
    	this.pending = 0
    	this.results = results
    	this.mergeHandler = mergeHandler
    };

    Merge.prototype.valueAt = function valueAt (x, i, promise) {
    	this.results[i] = x
    	this.check(this.pending - 1, promise)
    };

    Merge.prototype.fulfillAt = function fulfillAt (p, i, promise) {
    	this.valueAt(p.value, i, promise)
    };

    Merge.prototype.rejectAt = function rejectAt (p, i, promise) {
    	promise._become(p)
    };

    Merge.prototype.complete = function complete (total, promise) {
    	this.check(this.pending + total, promise)
    };

    Merge.prototype.check = function check (pending, promise) {
    	this.pending = pending
    	if (pending === 0) {
    		this.mergeHandler.merge(promise, this.results)
    	}
    };

    function resultsArray (iterable) {
    	return Array.isArray(iterable) ? new Array(iterable.length) : []
    }

    function resolveIterable (resolve, handler, promises, promise) {
    	var run = Array.isArray(promises) ? runArray : runIterable
    	try {
    		run(resolve, handler, promises, promise)
    	} catch (e) {
    		promise._reject(e)
    	}
    	return promise.near()
    }

    function runArray (resolve, handler, promises, promise) {
    	var i = 0

    	for (; i < promises.length; ++i) {
    		handleItem(resolve, handler, promises[i], i, promise)
    	}

    	handler.complete(i, promise)
    }

    function runIterable (resolve, handler, promises, promise) {
    	var i = 0
    	var iter = promises[Symbol.iterator]()

    	while (true) {
    		var step = iter.next()
    		if (step.done) {
    			break
    		}
    		handleItem(resolve, handler, step.value, i++, promise)
    	}

    	handler.complete(i, promise)
    }

    function handleItem (resolve, handler, x, i, promise) {
    	/*eslint complexity:[1,6]*/
    	if (!maybeThenable(x)) {
    		handler.valueAt(x, i, promise)
    		return
    	}

    	var p = resolve(x)

    	if (promise._isResolved()) {
    		if (!isFulfilled(p)) {
    			silenceError(p)
    		}
    	} else if (isFulfilled(p)) {
    		handler.fulfillAt(p, i, promise)
    	} else if (isRejected(p)) {
    		handler.rejectAt(p, i, promise)
    	} else {
    		settleAt(p, handler, i, promise)
    	}
    }

    function settleAt (p, handler, i, promise) {
    	p._runAction({handler: handler, i: i, promise: promise, fulfilled: fulfilled, rejected: rejected})
    }

    function fulfilled (p) {
    	this.handler.fulfillAt(p, this.i, this.promise)
    }

    function rejected (p) {
    	return this.handler.rejectAt(p, this.i, this.promise)
    }

    var taskQueue = new TaskQueue()
    /* istanbul ignore next */
    var errorHandler = new ErrorHandler(makeEmitError(), function (e) {
    	throw e.value
    })

    // -------------------------------------------------------------
    // ## Types
    // -------------------------------------------------------------

    // Internal base type to hold fantasy-land static constructors
    var Core = function Core () {};

    Core.empty = function empty () {
    	return never()
    };

    // of :: a -> Promise e a
    Core.of = function of (x) {
    	return fulfill(x)
    };

    // data Promise e a where
    //   Future    :: Promise e a
    //   Fulfilled :: a -> Promise e a
    //   Rejected  :: Error e => e -> Promise e a
    //   Never     :: Promise e a

    // Future :: Promise e a
    // A promise whose value cannot be known until some future time
    var Future = (function (Core) {
    	function Future () {
    		Core.call(this)
    		this.ref = void 0
    		this.action = void 0
    		this.length = 0
    	}

    	if ( Core ) Future.__proto__ = Core;
    	Future.prototype = Object.create( Core && Core.prototype );
    	Future.prototype.constructor = Future;

    	// then :: Promise e a -> (a -> b) -> Promise e b
    	// then :: Promise e a -> () -> (e -> b) -> Promise e b
    	// then :: Promise e a -> (a -> b) -> (e -> b) -> Promise e b
    	Future.prototype.then = function then$1 (f, r) {
    		var n = this.near()
    		return n === this ? then(f, r, n, new Future()) : n.then(f, r)
    	};

    	// catch :: Promise e a -> (e -> b) -> Promise e b
    	Future.prototype.catch = function catch$1 (r) {
    		var n = this.near()
    		return n === this ? then(void 0, r, n, new Future()) : n.catch(r)
    	};

    	// map :: Promise e a -> (a -> b) -> Promise e b
    	Future.prototype.map = function map$1 (f) {
    		var n = this.near()
    		return n === this ? map(f, n, new Future()) : n.map(f)
    	};

    	// ap :: Promise e (a -> b) -> Promise e a -> Promise e b
    	Future.prototype.ap = function ap (p) {
    		var n = this.near()
    		var pp = p.near()
    		return n === this ? this.chain(function (f) { return pp.map(f); }) : n.ap(pp)
    	};

    	// chain :: Promise e a -> (a -> Promise e b) -> Promise e b
    	Future.prototype.chain = function chain$1 (f) {
    		var n = this.near()
    		return n === this ? chain(f, n, new Future()) : n.chain(f)
    	};

    	// concat :: Promise e a -> Promise e a -> Promise e a
    	Future.prototype.concat = function concat (b) {
    		/* eslint complexity:[2,5] */
    		var n = this.near()
    		var bp = b.near()

    		return isSettled(n) || isNever(bp) ? n
    			: isSettled(bp) || isNever(n) ? bp
    			: race([n, bp])
    	};

    	// toString :: Promise e a -> String
    	Future.prototype.toString = function toString () {
    		return '[object ' + this.inspect() + ']'
    	};

    	// inspect :: Promise e a -> String
    	Future.prototype.inspect = function inspect () {
    		var n = this.near()
    		return n === this ? 'Promise { pending }' : n.inspect()
    	};

    	// near :: Promise e a -> Promise e a
    	Future.prototype.near = function near () {
    		if (!this._isResolved()) {
    			return this
    		}

    		this.ref = this.ref.near()
    		return this.ref
    	};

    	// state :: Promise e a -> Int
    	Future.prototype.state = function state () {
    		return this._isResolved() ? this.ref.near().state() : PENDING
    	};

    	Future.prototype._isResolved = function _isResolved () {
    		return this.ref !== void 0
    	};

    	Future.prototype._when = function _when (action) {
    		this._runAction(action)
    	};

    	Future.prototype._runAction = function _runAction (action) {
    		if (this.action === void 0) {
    			this.action = action
    		} else {
    			this[this.length++] = action
    		}
    	};

    	Future.prototype._resolve = function _resolve (x) {
    		this._become(resolve(x))
    	};

    	Future.prototype._fulfill = function _fulfill (x) {
    		this._become(new Fulfilled(x))
    	};

    	Future.prototype._reject = function _reject (e) {
    		if (this._isResolved()) {
    			return
    		}

    		this.__become(new Rejected(e))
    	};

    	Future.prototype._become = function _become (p) {
    		if (this._isResolved()) {
    			return
    		}

    		this.__become(p)
    	};

    	Future.prototype.__become = function __become (p) {
    		this.ref = p === this ? cycle() : p

    		if (this.action === void 0) {
    			return
    		}

    		taskQueue.add(this)
    	};

    	Future.prototype.run = function run () {
    		var this$1 = this;

    		var p = this.ref.near()
    		p._runAction(this.action)
    		this.action = void 0

    		for (var i = 0; i < this.length; ++i) {
    			p._runAction(this$1[i])
    			this$1[i] = void 0
    		}
    	};

    	return Future;
    }(Core));

    // Fulfilled :: a -> Promise e a
    // A promise whose value is already known
    var Fulfilled = (function (Core) {
    	function Fulfilled (x) {
    		Core.call(this)
    		this.value = x
    	}

    	if ( Core ) Fulfilled.__proto__ = Core;
    	Fulfilled.prototype = Object.create( Core && Core.prototype );
    	Fulfilled.prototype.constructor = Fulfilled;

    	Fulfilled.prototype.then = function then$2 (f) {
    		return typeof f === 'function' ? then(f, void 0, this, new Future()) : this
    	};

    	Fulfilled.prototype.catch = function catch$2 () {
    		return this
    	};

    	Fulfilled.prototype.map = function map$2 (f) {
    		return map(f, this, new Future())
    	};

    	Fulfilled.prototype.ap = function ap (p) {
    		return p.map(this.value)
    	};

    	Fulfilled.prototype.chain = function chain$2 (f) {
    		return chain(f, this, new Future())
    	};

    	Fulfilled.prototype.concat = function concat () {
    		return this
    	};

    	Fulfilled.prototype.toString = function toString () {
    		return '[object ' + this.inspect() + ']'
    	};

    	Fulfilled.prototype.inspect = function inspect () {
    		return 'Promise { fulfilled: ' + this.value + ' }'
    	};

    	Fulfilled.prototype.state = function state () {
    		return FULFILLED
    	};

    	Fulfilled.prototype.near = function near () {
    		return this
    	};

    	Fulfilled.prototype._when = function _when (action) {
    		taskQueue.add(new Continuation(action, this))
    	};

    	Fulfilled.prototype._runAction = function _runAction (action) {
    		action.fulfilled(this)
    	};

    	return Fulfilled;
    }(Core));

    // Rejected :: Error e => e -> Promise e a
    // A promise whose value cannot be known due to some reason/error
    var Rejected = (function (Core) {
    	function Rejected (e) {
    		Core.call(this)
    		this.value = e
    		this._state = REJECTED
    		errorHandler.track(this)
    	}

    	if ( Core ) Rejected.__proto__ = Core;
    	Rejected.prototype = Object.create( Core && Core.prototype );
    	Rejected.prototype.constructor = Rejected;

    	Rejected.prototype.then = function then$3 (_, r) {
    		return typeof r === 'function' ? this.catch(r) : this
    	};

    	Rejected.prototype.catch = function catch$3 (r) {
    		return then(void 0, r, this, new Future())
    	};

    	Rejected.prototype.map = function map$3 () {
    		return this
    	};

    	Rejected.prototype.ap = function ap () {
    		return this
    	};

    	Rejected.prototype.chain = function chain$3 () {
    		return this
    	};

    	Rejected.prototype.concat = function concat () {
    		return this
    	};

    	Rejected.prototype.toString = function toString () {
    		return '[object ' + this.inspect() + ']'
    	};

    	Rejected.prototype.inspect = function inspect () {
    		return 'Promise { rejected: ' + this.value + ' }'
    	};

    	Rejected.prototype.state = function state () {
    		return this._state
    	};

    	Rejected.prototype.near = function near () {
    		return this
    	};

    	Rejected.prototype._when = function _when (action) {
    		taskQueue.add(new Continuation(action, this))
    	};

    	Rejected.prototype._runAction = function _runAction (action) {
    		if (action.rejected(this)) {
    			errorHandler.untrack(this)
    		}
    	};

    	return Rejected;
    }(Core));

    // Never :: Promise e a
    // A promise that waits forever for its value to be known
    var Never = (function (Core) {
    	function Never () {
    		Core.apply(this, arguments);
    	}

    	if ( Core ) Never.__proto__ = Core;
    	Never.prototype = Object.create( Core && Core.prototype );
    	Never.prototype.constructor = Never;

    	Never.prototype.then = function then$4 () {
    		return this
    	};

    	Never.prototype.catch = function catch$4 () {
    		return this
    	};

    	Never.prototype.map = function map$4 () {
    		return this
    	};

    	Never.prototype.ap = function ap () {
    		return this
    	};

    	Never.prototype.chain = function chain$4 () {
    		return this
    	};

    	Never.prototype.concat = function concat (b) {
    		return b
    	};

    	Never.prototype.toString = function toString () {
    		return '[object ' + this.inspect() + ']'
    	};

    	Never.prototype.inspect = function inspect () {
    		return 'Promise { never }'
    	};

    	Never.prototype.state = function state () {
    		return PENDING | NEVER
    	};

    	Never.prototype.near = function near () {
    		return this
    	};

    	Never.prototype._when = function _when () {
    	};

    	Never.prototype._runAction = function _runAction () {
    	};

    	return Never;
    }(Core));

    // -------------------------------------------------------------
    // ## Creating promises
    // -------------------------------------------------------------

    // resolve :: Thenable e a -> Promise e a
    // resolve :: a -> Promise e a
    function resolve (x) {
    	return isPromise(x) ? x.near()
    		: maybeThenable(x) ? refForMaybeThenable(fulfill, x)
    		: new Fulfilled(x)
    }

    // reject :: e -> Promise e a
    function reject (e) {
    	return new Rejected(e)
    }

    // never :: Promise e a
    function never () {
    	return new Never()
    }

    // fulfill :: a -> Promise e a
    function fulfill (x) {
    	return new Fulfilled(x)
    }

    // future :: () -> { resolve: Resolve e a, promise: Promise e a }
    // type Resolve e a = a|Thenable e a -> ()
    function future () {
    	var promise = new Future()
    	return {resolve: function (x) { return promise._resolve(x); }, promise: promise}
    }

    // -------------------------------------------------------------
    // ## Iterables
    // -------------------------------------------------------------

    // all :: Iterable (Promise e a) -> Promise e [a]
    function all (promises) {
    	var handler = new Merge(allHandler, resultsArray(promises))
    	return iterablePromise(handler, promises)
    }

    var allHandler = {
    	merge: function merge (promise, args) {
    		promise._fulfill(args)
    	}
    }

    // race :: Iterable (Promise e a) -> Promise e a
    function race (promises) {
    	return iterablePromise(new Race(never), promises)
    }

    function isIterable (x) {
    	return typeof x === 'object' && x !== null
    }

    function iterablePromise (handler, iterable) {
    	if (!isIterable(iterable)) {
    		return reject(new TypeError('expected an iterable'))
    	}

    	var p = new Future()
    	return resolveIterable(resolveMaybeThenable, handler, iterable, p)
    }

    // -------------------------------------------------------------
    // # Internals
    // -------------------------------------------------------------

    // isPromise :: * -> boolean
    function isPromise (x) {
    	return x instanceof Core
    }

    function resolveMaybeThenable (x) {
    	return isPromise(x) ? x.near() : refForMaybeThenable(fulfill, x)
    }

    function refForMaybeThenable (otherwise, x) {
    	try {
    		var then = x.then
    		return typeof then === 'function'
    			? extractThenable(then, x)
    			: otherwise(x)
    	} catch (e) {
    		return new Rejected(e)
    	}
    }

    // WARNING: Naming the first arg "then" triggers babel compilation bug
    function extractThenable (thn, thenable) {
    	var p = new Future()

    	try {
    		thn.call(thenable, function (x) { return p._resolve(x); }, function (e) { return p._reject(e); })
    	} catch (e) {
    		p._reject(e)
    	}

    	return p.near()
    }

    function cycle () {
    	return new Rejected(new TypeError('resolution cycle'))
    }

    var Continuation = function Continuation (action, promise) {
    	this.action = action
    	this.promise = promise
    };

    Continuation.prototype.run = function run () {
    	this.promise._runAction(this.action)
    };

    function _delay (ms, p, promise) {
    	p._runAction(new Delay(ms, promise))
    	return promise
    }

    var Delay = function Delay (time, promise) {
    	this.time = time
    	this.promise = promise
    };

    Delay.prototype.fulfilled = function fulfilled (p) {
    	/*global setTimeout*/
    	setTimeout(become, this.time, p, this.promise)
    };

    Delay.prototype.rejected = function rejected (p) {
    	this.promise._become(p)
    };

    function become (p, promise) {
    	promise._become(p)
    }

    var TimeoutError = (function (Error) {
    	function TimeoutError (message) {
    		Error.call(this)
    		this.message = message
    		this.name = TimeoutError.name
    		/* istanbul ignore else */
    		if (typeof Error.captureStackTrace === 'function') {
    			Error.captureStackTrace(this, TimeoutError)
    		}
    	}

    	if ( Error ) TimeoutError.__proto__ = Error;
    	TimeoutError.prototype = Object.create( Error && Error.prototype );
    	TimeoutError.prototype.constructor = TimeoutError;

    	return TimeoutError;
    }(Error));

    function _timeout (ms, p, promise) {
    	var timer = setTimeout(rejectOnTimeout, ms, promise)
    	p._runAction(new Timeout(timer, promise))
    	return promise
    }

    var Timeout = function Timeout (timer, promise) {
    	this.timer = timer
    	this.promise = promise
    };

    Timeout.prototype.fulfilled = function fulfilled (p) {
    	clearTimeout(this.timer)
    	this.promise._become(p)
    };

    Timeout.prototype.rejected = function rejected (p) {
    	clearTimeout(this.timer)
    	this.promise._become(p)
    	return false
    };

    function rejectOnTimeout (promise) {
    	promise._reject(new TimeoutError('promise timeout'))
    }

    var Any = function Any () {
    	this.pending = 0
    };

    Any.prototype.valueAt = function valueAt (x, i, promise) {
    	promise._fulfill(x)
    };

    Any.prototype.fulfillAt = function fulfillAt (p, i, promise) {
    	promise._become(p)
    };

    Any.prototype.rejectAt = function rejectAt (p, i, promise) {
    	silenceError(p)
    	this.check(this.pending - 1, promise)
    };

    Any.prototype.complete = function complete (total, promise) {
    	this.check(this.pending + total, promise)
    };

    Any.prototype.check = function check (pending, promise) {
    	this.pending = pending
    	if (pending === 0) {
    		promise._reject(new RangeError('No fulfilled promises in input'))
    	}
    };

    var Settle = function Settle (resolve, results) {
    	this.pending = 0
    	this.results = results
    	this.resolve = resolve
    };

    Settle.prototype.valueAt = function valueAt (x, i, promise) {
    	this.settleAt(this.resolve(x), i, promise)
    };

    Settle.prototype.fulfillAt = function fulfillAt (p, i, promise) {
    	this.settleAt(p, i, promise)
    };

    Settle.prototype.rejectAt = function rejectAt (p, i, promise) {
    	silenceError(p)
    	this.settleAt(p, i, promise)
    };

    Settle.prototype.settleAt = function settleAt (p, i, promise) {
    	this.results[i] = p
    	this.check(this.pending - 1, promise)
    };

    Settle.prototype.complete = function complete (total, promise) {
    	this.check(this.pending + total, promise)
    };

    Settle.prototype.check = function check (pending, promise) {
    	this.pending = pending
    	if (pending === 0) {
    		promise._fulfill(this.results)
    	}
    };

    function runPromise$1 (f, thisArg, args, promise) {
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

    function runNode$1 (f, thisArg, args, promise) {
    	/* eslint complexity:[2,5] */
    	function settleNode (e, x) {
    		if (e) {
    			promise._reject(e)
    		} else {
    			promise._fulfill(x)
    		}
    	}

    	switch (args.length) {
    		case 0:
    			f.call(thisArg, settleNode)
    			break
    		case 1:
    			f.call(thisArg, args[0], settleNode)
    			break
    		case 2:
    			f.call(thisArg, args[0], args[1], settleNode)
    			break
    		case 3:
    			f.call(thisArg, args[0], args[1], args[2], settleNode)
    			break
    		default:
    			args.push(settleNode)
    			f.apply(thisArg, args)
    	}

    	return promise
    }

    function _runCoroutine (resolve, iterator, promise) {
    	new Coroutine(resolve, iterator, promise).run()
    	return promise
    }

    var Coroutine = function Coroutine (resolve, iterator, promise) {
    	this.resolve = resolve
    	this.iterator = iterator
    	this.promise = promise
    };

    Coroutine.prototype.run = function run () {
    	this.step(this.iterator.next, void 0)
    };

    Coroutine.prototype.step = function step (continuation, x) {
    	try {
    		this.handle(continuation.call(this.iterator, x))
    	} catch (e) {
    		this.promise._reject(e)
    	}
    };

    Coroutine.prototype.handle = function handle (result) {
    	if (result.done) {
    		return this.promise._resolve(result.value)
    	}

    	this.resolve(result.value)._runAction(this)
    };

    Coroutine.prototype.fulfilled = function fulfilled (ref) {
    	this.step(this.iterator.next, ref.value)
    };

    Coroutine.prototype.rejected = function rejected (ref) {
    	this.step(this.iterator.throw, ref.value)
    	return true
    };

    // -------------------------------------------------------------
    // ## Coroutine
    // -------------------------------------------------------------

    // coroutine :: Generator e a -> (...* -> Promise e a)
    // Make a coroutine from a promise-yielding generator
    function coroutine (generator) {
    	return function () {
    		var args = [], len = arguments.length;
    		while ( len-- ) args[ len ] = arguments[ len ];

    		return runGenerator(generator, this, args)
    	}
    }

    function runGenerator (generator, thisArg, args) {
    	var iterator = generator.apply(thisArg, args)
    	return _runCoroutine(resolve, iterator, new Future())
    }

    // -------------------------------------------------------------
    // ## Node-style async
    // -------------------------------------------------------------

    // type Nodeback e a = e -> a -> ()
    // type NodeApi e a = ...* -> Nodeback e a -> ()

    // fromNode :: NodeApi e a -> (...args -> Promise e a)
    // Turn a Node API into a promise API
    function fromNode (f) {
    	return function () {
    		var args = [], len = arguments.length;
    		while ( len-- ) args[ len ] = arguments[ len ];

    		return runResolver(runNode$1, f, this, args, new Future())
    	}
    }

    // runNode :: NodeApi e a -> ...* -> Promise e a
    // Run a Node API, returning a promise for the outcome
    function runNode (f) {
    	var args = [], len = arguments.length - 1;
    	while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    	return runResolver(runNode$1, f, this, args, new Future())
    }

    // -------------------------------------------------------------
    // ## Make a promise
    // -------------------------------------------------------------

    // type Resolve e a = a|Thenable e a -> ()
    // type Reject e = e -> ()
    // type Producer e a = (...* -> Resolve e a -> Reject e -> ())
    // runPromise :: Producer e a -> ...* -> Promise e a
    function runPromise (f) {
    	var args = [], len = arguments.length - 1;
    	while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    	return runResolver(runPromise$1, f, this, args, new Future())
    }

    function runResolver (run, f, thisArg, args, p) {
    	checkFunction(f)

    	try {
    		run(f, thisArg, args, p)
    	} catch (e) {
    		p._reject(e)
    	}

    	return p
    }

    // -------------------------------------------------------------
    // ## Time
    // -------------------------------------------------------------

    // delay :: number -> Promise e a -> Promise e a
    function delay (ms, x) {
    	/* eslint complexity:[2,4] */
    	var p = resolve(x)
    	return ms <= 0 || isRejected(p) || isNever(p) ? p
    		: _delay(ms, p, new Future())
    }

    // timeout :: number -> Promise e a -> Promise (e|TimeoutError) a
    function timeout (ms, x) {
    	var p = resolve(x)
    	return isSettled(p) ? p : _timeout(ms, p, new Future())
    }

    // -------------------------------------------------------------
    // ## Iterables
    // -------------------------------------------------------------

    // any :: Iterable (Promise e a) -> Promise e a
    function any (promises) {
    	return iterablePromise(new Any(), promises)
    }

    // settle :: Iterable (Promise e a) -> Promise e [Promise e a]
    function settle (promises) {
    	var handler = new Settle(resolve, resultsArray(promises))
    	return iterablePromise(handler, promises)
    }

    // -------------------------------------------------------------
    // ## Lifting
    // -------------------------------------------------------------

    // merge :: (...* -> b) -> ...Promise e a -> Promise e b
    function merge (f) {
    	var args = [], len = arguments.length - 1;
    	while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    	return runMerge(f, this, args)
    }

    function runMerge (f, thisArg, args) {
    	var handler = new Merge(new MergeHandler(f, thisArg), resultsArray(args))
    	return iterablePromise(handler, args)
    }

    var MergeHandler = function MergeHandler (f, c) {
    	this.f = f
    	this.c = c
    	this.promise = void 0
    	this.args = void 0
    };

    MergeHandler.prototype.merge = function merge$1 (promise, args) {
    	this.promise = promise
    	this.args = args
    	taskQueue.add(this)
    };

    MergeHandler.prototype.run = function run () {
    	try {
    		this.promise._resolve(this.f.apply(this.c, this.args))
    	} catch (e) {
    		this.promise._reject(e)
    	}
    };

    function checkFunction (f) {
    	if (typeof f !== 'function') {
    		throw new TypeError('must provide a resolver function')
    	}
    }

    // -------------------------------------------------------------
    // ## ES6 Promise polyfill
    // -------------------------------------------------------------

    var NOARGS = []

    // type Resolve a = a -> ()
    // type Reject e = e -> ()
    // Promise :: (Resolve a -> Reject e) -> Promise e a
    var CreedPromise = (function (Future) {
    	function CreedPromise (f) {
    		Future.call(this)
    		runResolver(runPromise$1, f, void 0, NOARGS, this)
    	}

    	if ( Future ) CreedPromise.__proto__ = Future;
    	CreedPromise.prototype = Object.create( Future && Future.prototype );
    	CreedPromise.prototype.constructor = CreedPromise;

    	return CreedPromise;
    }(Future));

    CreedPromise.resolve = resolve
    CreedPromise.reject = reject
    CreedPromise.all = all
    CreedPromise.race = race

    function shim () {
    	/* global self */
    	var orig = typeof Promise === 'function' && Promise

    	/* istanbul ignore if */
    	if (typeof self !== 'undefined') {
    		self.Promise = CreedPromise
    		/* istanbul ignore else */
    	} else if (typeof global !== 'undefined') {
    		global.Promise = CreedPromise
    	}

    	return orig
    }

    /* istanbul ignore if */
    if (typeof Promise !== 'function') {
    	shim()
    }

    exports.resolve = resolve;
    exports.reject = reject;
    exports.future = future;
    exports.never = never;
    exports.fulfill = fulfill;
    exports.all = all;
    exports.race = race;
    exports.isFulfilled = isFulfilled;
    exports.isRejected = isRejected;
    exports.isSettled = isSettled;
    exports.isPending = isPending;
    exports.isNever = isNever;
    exports.getValue = getValue;
    exports.getReason = getReason;
    exports.coroutine = coroutine;
    exports.fromNode = fromNode;
    exports.runNode = runNode;
    exports.runPromise = runPromise;
    exports.delay = delay;
    exports.timeout = timeout;
    exports.any = any;
    exports.settle = settle;
    exports.merge = merge;
    exports.shim = shim;
    exports.Promise = CreedPromise;

    Object.defineProperty(exports, '__esModule', { value: true });

}));