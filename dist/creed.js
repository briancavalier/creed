(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	factory((global.creed = {}))
}(this, function (exports) { 'use strict';

	'use strict';

	/*eslint no-multi-spaces: 0*/
	var PENDING = 1 << 0;
	var FULFILLED = 1 << 1;
	var REJECTED = 1 << 2;
	var SETTLED = FULFILLED | REJECTED;
	var NEVER = 1 << 3;

	var HANDLED = 1 << 4;

	'use strict';

	function isPending(p) {
	    return (p.state() & PENDING) > 0;
	}

	function isFulfilled(p) {
	    return (p.state() & FULFILLED) > 0;
	}

	function isRejected(p) {
	    return (p.state() & REJECTED) > 0;
	}

	function isSettled(p) {
	    return (p.state() & SETTLED) > 0;
	}

	function isNever(p) {
	    return (p.state() & NEVER) > 0;
	}

	function isHandled(p) {
	    return (p.state() & HANDLED) > 0;
	}

	function getValue(p) {
	    var n = p.near();
	    if (!isFulfilled(n)) {
	        throw new TypeError('getValue called on ' + p);
	    }

	    return n.value;
	}

	function getReason(p) {
	    var n = p.near();
	    if (!isRejected(n)) {
	        throw new TypeError('getReason called on ' + p);
	    }

	    return n.value;
	}

	function silenceError(p) {
	    p._runAction(silencer);
	}

	var silencer = {
	    fulfilled: function fulfilled() {},
	    rejected: function rejected(p) {
	        p._state |= HANDLED;
	    }
	};

	exports.isFulfilled = isFulfilled;
	exports.isRejected = isRejected;
	exports.isSettled = isSettled;
	exports.isPending = isPending;
	exports.isNever = isNever;
	exports.getValue = getValue;
	exports.getReason = getReason;

	'use strict';

	/*global process,MutationObserver,WebKitMutationObserver */

	var isNode = typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]';

	/* istanbul ignore next */
	var MutationObs = typeof MutationObserver === 'function' && MutationObserver || typeof WebKitMutationObserver === 'function' && WebKitMutationObserver;

	/** @license MIT License (c) copyright 2010-2014 original author or authors */
	/** @author Brian Cavalier */
	/** @author John Hann */

	'use strict';

	var makeAsync = function (f) {
	    //jscs:disable validateIndentation
	    return isNode ? createNodeScheduler(f) /* istanbul ignore next */
	    : MutationObs ? createBrowserScheduler(f) : createFallbackScheduler(f);
	}

	/* istanbul ignore next */
	function createFallbackScheduler(f) {
	    return function () {
	        return setTimeout(f, 0);
	    };
	}

	function createNodeScheduler(f) {
	    return function () {
	        return process.nextTick(f);
	    };
	}

	/* istanbul ignore next */
	function createBrowserScheduler(f) {
	    var node = document.createTextNode('');
	    new MutationObs(f).observe(node, { characterData: true });

	    var i = 0;
	    return function () {
	        return node.data = i ^= 1;
	    };
	}

	// Unfortunately, jscs indentation does weird things to the TaskQueue
	// method bodies.  Have to disable for now.
	// jscs:disable

	'use strict';

	function TaskQueue___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var TaskQueue = (function () {
		function TaskQueue() {
			var _this = this;

			TaskQueue___classCallCheck(this, TaskQueue);

			this.tasks = new Array(2 << 15);
			this.length = 0;
			this.drain = makeAsync(function () {
				return _this._drain();
			});
		}

		TaskQueue.prototype.add = function add(task) {
			if (this.length === 0) {
				this.drain();
			}

			this.tasks[this.length++] = task;
		};

		TaskQueue.prototype._drain = function _drain() {
			var q = this.tasks;
			for (var i = 0; i < this.length; ++i) {
				q[i].run();
				q[i] = void 0;
			}
			this.length = 0;
		};

		return TaskQueue;
	})();

	'use strict';

	function ErrorHandler___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var ErrorHandler__UNHANDLED_REJECTION = 'unhandledRejection';
	var HANDLED_REJECTION = 'rejectionHandled';

	var ErrorHandler = (function () {
	    function ErrorHandler(emitEvent, reportError) {
	        ErrorHandler___classCallCheck(this, ErrorHandler);

	        this.errors = [];
	        this.emit = emitEvent;
	        this.reportError = reportError;
	    }

	    ErrorHandler.prototype.track = function track(e) {
	        if (!this.emit(ErrorHandler__UNHANDLED_REJECTION, e, e.value)) {
	            /* istanbul ignore else */
	            if (this.errors.length === 0) {
	                setTimeout(reportErrors, 1, this.reportError, this.errors);
	            }
	            this.errors.push(e);
	        }
	    };

	    ErrorHandler.prototype.untrack = function untrack(e) {
	        silenceError(e);
	        this.emit(HANDLED_REJECTION, e);
	    };

	    return ErrorHandler;
	})();



	function reportErrors(report, errors) {
	    try {
	        reportAll(errors, report);
	    } finally {
	        errors.length = 0;
	    }
	}

	function reportAll(errors, report) {
	    for (var i = 0; i < errors.length; ++i) {
	        var e = errors[i];
	        /* istanbul ignore else */
	        if (!isHandled(e)) {
	            report(e);
	        }
	    }
	}

	'use strict';

	var makeEmitError__UNHANDLED_REJECTION = 'unhandledRejection';

	var makeEmitError = function () {
	    /*global process, self, CustomEvent*/
	    // istanbul ignore else */
	    if (isNode && typeof process.emit === 'function') {
	        // Returning falsy here means to call the default reportRejection API.
	        // This is safe even in browserify since process.emit always returns
	        // falsy in browserify:
	        return function (type, error) {
	            return type === makeEmitError__UNHANDLED_REJECTION ? process.emit(type, error.value, error) : process.emit(type, error);
	        };
	    } else if (typeof self !== 'undefined' && typeof CustomEvent === 'function') {
	        return (function (noop, self, CustomEvent) {
	            var hasCustomEvent;
	            try {
	                hasCustomEvent = new CustomEvent(makeEmitError__UNHANDLED_REJECTION) instanceof CustomEvent;
	            } catch (e) {
	                hasCustomEvent = false;
	            }

	            return !hasCustomEvent ? noop : function (type, error) {
	                var ev = new CustomEvent(type, {
	                    detail: {
	                        reason: error.value,
	                        promise: error
	                    },
	                    bubbles: false,
	                    cancelable: true
	                });

	                return !self.dispatchEvent(ev);
	            };
	        })(noop, self, CustomEvent);
	    }

	    // istanbul ignore next */
	    return noop;
	}

	// istanbul ignore next */
	function noop() {}
	// https://github.com/defunctzombie/node-process/blob/master/browser.js#L40-L46

	'use strict';



	function maybeThenable(x) {
	    return (typeof x === 'object' || typeof x === 'function') && x !== null;
	}

	'use strict';

	var _then = then;

	function _then___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	function then(f, r, p, promise) {
	    p._when(new Then(f, r, promise));
	    return promise;
	}

	var Then = (function () {
	    function Then(f, r, promise) {
	        _then___classCallCheck(this, Then);

	        this.f = f;
	        this.r = r;
	        this.promise = promise;
	    }

	    Then.prototype.fulfilled = function fulfilled(p) {
	        runThen(this.f, p, this.promise);
	    };

	    Then.prototype.rejected = function rejected(p) {
	        return runThen(this.r, p, this.promise);
	    };

	    return Then;
	})();

	function runThen(f, p, promise) {
	    if (typeof f !== 'function') {
	        promise._become(p);
	        return false;
	    }

	    tryMapNext(f, p.value, promise);
	    return true;
	}

	function tryMapNext(f, x, promise) {
	    try {
	        promise._resolve(f(x));
	    } catch (e) {
	        promise._reject(e);
	    }
	}

	'use strict';

	function build_map___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	function build_map__map(f, p, promise) {
	    return runMap(applyMap, f, p, promise);
	}

	function build_map__chain(f, p, promise) {
	    return runMap(applyChain, f, p, promise);
	}

	function runMap(apply, f, p, promise) {
	    p._when(new build_map__Map(apply, f, promise));
	    return promise;
	}

	function applyMap(f, x, p) {
	    p._fulfill(f(x));
	}

	function applyChain(f, x, p) {
	    p._become(f(x).near());
	}

	var build_map__Map = (function () {
	    function Map(apply, f, promise) {
	        build_map___classCallCheck(this, Map);

	        this.apply = apply;
	        this.f = f;
	        this.promise = promise;
	    }

	    Map.prototype.fulfilled = function fulfilled(p) {
	        try {
	            this.apply(this.f, p.value, this.promise);
	        } catch (e) {
	            this.promise._reject(e);
	        }
	    };

	    Map.prototype.rejected = function rejected(p) {
	        this.promise._become(p);
	        return false;
	    };

	    return Map;
	})();

	'use strict';

	function Race___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var Race = (function () {
	    function Race(never) {
	        Race___classCallCheck(this, Race);

	        this.never = never;
	    }

	    Race.prototype.valueAt = function valueAt(x, i, promise) {
	        promise._fulfill(x);
	    };

	    Race.prototype.fulfillAt = function fulfillAt(p, i, promise) {
	        promise._become(p);
	    };

	    Race.prototype.rejectAt = function rejectAt(p, i, promise) {
	        promise._become(p);
	    };

	    Race.prototype.complete = function complete(total, promise) {
	        if (total === 0) {
	            promise._become(this.never());
	        }
	    };

	    return Race;
	})();

	'use strict';

	function Merge___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var Merge = (function () {
	    function Merge(mergeHandler, results) {
	        Merge___classCallCheck(this, Merge);

	        this.done = false;
	        this.pending = 0;
	        this.results = results;
	        this.mergeHandler = mergeHandler;
	    }

	    Merge.prototype.valueAt = function valueAt(x, i, promise) {
	        this.results[i] = x;
	        this.check(this.pending - 1, promise);
	    };

	    Merge.prototype.fulfillAt = function fulfillAt(p, i, promise) {
	        this.valueAt(p.value, i, promise);
	    };

	    Merge.prototype.rejectAt = function rejectAt(p, i, promise) {
	        promise._become(p);
	    };

	    Merge.prototype.complete = function complete(total, promise) {
	        this.done = true;
	        this.check(this.pending + total, promise);
	    };

	    Merge.prototype.check = function check(pending, promise) {
	        this.pending = pending;
	        if (this.done && pending === 0) {
	            this.mergeHandler.merge(promise, this.results);
	        }
	    };

	    return Merge;
	})();

	'use strict';

	function build_iterable___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	function resultsArray(iterable) {
	    return Array.isArray(iterable) ? new Array(iterable.length) : [];
	}

	function resolveIterable(resolve, itemHandler, promises, promise) {
	    var run = Array.isArray(promises) ? runArray : runIterable;
	    try {
	        run(resolve, itemHandler, promises, promise);
	    } catch (e) {
	        promise._reject(e);
	    }
	    return promise.near();
	}

	function runArray(resolve, itemHandler, promises, promise) {
	    var i = 0;

	    for (; i < promises.length; ++i) {
	        handleItem(resolve, itemHandler, promises[i], i, promise);
	    }

	    itemHandler.complete(i, promise);
	}

	function runIterable(resolve, itemHandler, promises, promise) {
	    var i = 0;

	    var _iteratorNormalCompletion = true;
	    var _didIteratorError = false;
	    var _iteratorError = undefined;

	    try {
	        for (var _iterator = promises[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	            var x = _step.value;

	            handleItem(resolve, itemHandler, x, i++, promise);
	        }
	    } catch (err) {
	        _didIteratorError = true;
	        _iteratorError = err;
	    } finally {
	        try {
	            if (!_iteratorNormalCompletion && _iterator['return']) {
	                _iterator['return']();
	            }
	        } finally {
	            if (_didIteratorError) {
	                throw _iteratorError;
	            }
	        }
	    }

	    itemHandler.complete(i, promise);
	}

	function handleItem(resolve, itemHandler, x, i, promise) {
	    /*eslint complexity:[1,6]*/
	    if (maybeThenable(x)) {
	        var p = resolve(x);

	        if (promise._isResolved()) {
	            if (!isFulfilled(p)) {
	                silenceError(p);
	            }
	        } else if (isFulfilled(p)) {
	            itemHandler.fulfillAt(p, i, promise);
	        } else if (isRejected(p)) {
	            itemHandler.rejectAt(p, i, promise);
	        } else {
	            p._runAction(new SettleAt(itemHandler, i, promise));
	        }
	    } else {
	        itemHandler.valueAt(x, i, promise);
	    }
	}

	var SettleAt = (function () {
	    function SettleAt(handler, index, promise) {
	        build_iterable___classCallCheck(this, SettleAt);

	        this.handler = handler;
	        this.index = index;
	        this.promise = promise;
	    }

	    SettleAt.prototype.fulfilled = function fulfilled(p) {
	        this.handler.fulfillAt(p, this.index, this.promise);
	    };

	    SettleAt.prototype.rejected = function rejected(p) {
	        return this.handler.rejectAt(p, this.index, this.promise);
	    };

	    return SettleAt;
	})();

	'use strict';

	function build_Promise___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var taskQueue = new TaskQueue();
	var errorHandler = new ErrorHandler(makeEmitError(), function (e) {
	    throw e.value;
	});

	// -------------------------------------------------------------
	// ## Types
	// -------------------------------------------------------------

	// data Promise e a where
	//   Future    :: Promise e a
	//   Fulfilled :: a -> Promise e a
	//   Rejected  :: Error e => e -> Promise e a
	//   Never     :: Promise e a

	// Future :: Promise e a
	// A promise whose value cannot be known until some future time

	var Future = (function () {
	    function Future() {
	        build_Promise___classCallCheck(this, Future);

	        this.ref = void 0;
	        this.action = void 0;
	        this.length = 0;
	    }

	    // Fulfilled :: a -> Promise e a
	    // A promise whose value is already known

	    // empty :: Promise e a

	    Future.empty = function empty() {
	        return never();
	    };

	    // of :: a -> Promise e a

	    Future.of = function of(x) {
	        return fulfill(x);
	    };

	    // then :: Promise e a -> (a -> b) -> Promise e b
	    // then :: Promise e a -> () -> (e -> b) -> Promise e b
	    // then :: Promise e a -> (a -> b) -> (e -> b) -> Promise e b

	    Future.prototype.then = function then(f, r) {
	        var n = this.near();
	        return n === this ? _then(f, r, n, new Future()) : n.then(f, r);
	    };

	    // catch :: Promise e a -> (e -> b) -> Promise e b

	    Future.prototype['catch'] = function _catch(r) {
	        var n = this.near();
	        return n === this ? _then(void 0, r, n, new Future()) : n['catch'](r);
	    };

	    // map :: Promise e a -> (a -> b) -> Promise e b

	    Future.prototype.map = function map(f) {
	        var n = this.near();
	        return n === this ? build_map__map(f, n, new Future()) : n.map(f);
	    };

	    // ap :: Promise e (a -> b) -> Promise e a -> Promise e b

	    Future.prototype.ap = function ap(p) {
	        var n = this.near();
	        var pp = p.near();
	        return n === this ? this.chain(function (f) {
	            return pp.map(f);
	        }) : n.ap(pp);
	    };

	    // chain :: Promise e a -> (a -> Promise e b) -> Promise e b

	    Future.prototype.chain = function chain(f) {
	        var n = this.near();
	        return n === this ? build_map__chain(f, n, new Future()) : n.chain(f);
	    };

	    // concat :: Promise e a -> Promise e a -> Promise e a

	    Future.prototype.concat = function concat(b) {
	        var n = this.near();
	        var bp = b.near();

	        return n !== this ? n.concat(bp) : isNever(bp) ? n : isSettled(bp) ? bp : race([n, bp]);
	    };

	    // toString :: Promise e a -> String

	    Future.prototype.toString = function toString() {
	        return '[object ' + this.inspect() + ']';
	    };

	    // inspect :: Promise e a -> String

	    Future.prototype.inspect = function inspect() {
	        var n = this.near();
	        return n === this ? 'Promise { pending }' : n.inspect();
	    };

	    // near :: Promise e a -> Promise e a

	    Future.prototype.near = function near() {
	        if (!this._isResolved()) {
	            return this;
	        }

	        this.ref = this.ref.near();
	        return this.ref;
	    };

	    // state :: Promise e a -> Int

	    Future.prototype.state = function state() {
	        return this._isResolved() ? this.ref.near().state() : PENDING;
	    };

	    Future.prototype._isResolved = function _isResolved() {
	        return this.ref !== void 0;
	    };

	    Future.prototype._when = function _when(action) {
	        this._runAction(action);
	    };

	    Future.prototype._runAction = function _runAction(action) {
	        if (this.action === void 0) {
	            this.action = action;
	        } else {
	            this[this.length++] = action;
	        }
	    };

	    Future.prototype._resolve = function _resolve(x) {
	        this._become(resolve(x));
	    };

	    Future.prototype._fulfill = function _fulfill(x) {
	        this._become(new Fulfilled(x));
	    };

	    Future.prototype._reject = function _reject(e) {
	        if (this._isResolved()) {
	            return;
	        }

	        this.__become(new Rejected(e));
	    };

	    Future.prototype._become = function _become(ref) {
	        if (this._isResolved()) {
	            return;
	        }

	        this.__become(ref);
	    };

	    Future.prototype.__become = function __become(ref) {
	        this.ref = ref === this ? cycle() : ref;
	        taskQueue.add(this);
	    };

	    Future.prototype.run = function run() {
	        if (this.action === void 0) {
	            return;
	        }

	        var ref = this.ref.near();
	        ref._runAction(this.action);
	        this.action = void 0;

	        for (var i = 0; i < this.length; ++i) {
	            ref._runAction(this[i]);
	            this[i] = void 0;
	        }
	    };

	    return Future;
	})();

	var Fulfilled = (function () {
	    function Fulfilled(x) {
	        build_Promise___classCallCheck(this, Fulfilled);

	        this.value = x;
	    }

	    // Rejected :: Error e => e -> Promise e a
	    // A promise whose value cannot be known due to some reason/error

	    Fulfilled.prototype.then = function then(f) {
	        return typeof f === 'function' ? _then(f, void 0, this, new Future()) : this;
	    };

	    Fulfilled.prototype['catch'] = function _catch() {
	        return this;
	    };

	    Fulfilled.prototype.map = function map(f) {
	        return build_map__map(f, this, new Future());
	    };

	    Fulfilled.prototype.ap = function ap(p) {
	        return p.map(this.value);
	    };

	    Fulfilled.prototype.chain = function chain(f) {
	        return build_map__chain(f, this, new Future());
	    };

	    Fulfilled.prototype.concat = function concat() {
	        return this;
	    };

	    Fulfilled.prototype.toString = function toString() {
	        return '[object ' + this.inspect() + ']';
	    };

	    Fulfilled.prototype.inspect = function inspect() {
	        return 'Promise { fulfilled: ' + this.value + ' }';
	    };

	    Fulfilled.prototype.state = function state() {
	        return FULFILLED;
	    };

	    Fulfilled.prototype.near = function near() {
	        return this;
	    };

	    Fulfilled.prototype._when = function _when(action) {
	        taskQueue.add(new Continuation(action, this));
	    };

	    Fulfilled.prototype._runAction = function _runAction(action) {
	        action.fulfilled(this);
	    };

	    return Fulfilled;
	})();

	var Rejected = (function () {
	    function Rejected(e) {
	        build_Promise___classCallCheck(this, Rejected);

	        this.value = e;
	        this._state = REJECTED;
	        errorHandler.track(this);
	    }

	    // Never :: Promise e a
	    // A promise that waits forever for its value to be known

	    Rejected.prototype.then = function then(_, r) {
	        return typeof r === 'function' ? this['catch'](r) : this;
	    };

	    Rejected.prototype['catch'] = function _catch(r) {
	        return _then(void 0, r, this, new Future());
	    };

	    Rejected.prototype.map = function map() {
	        return this;
	    };

	    Rejected.prototype.ap = function ap() {
	        return this;
	    };

	    Rejected.prototype.chain = function chain() {
	        return this;
	    };

	    Rejected.prototype.concat = function concat() {
	        return this;
	    };

	    Rejected.prototype.toString = function toString() {
	        return '[object ' + this.inspect() + ']';
	    };

	    Rejected.prototype.inspect = function inspect() {
	        return 'Promise { rejected: ' + this.value + ' }';
	    };

	    Rejected.prototype.state = function state() {
	        return this._state;
	    };

	    Rejected.prototype.near = function near() {
	        return this;
	    };

	    Rejected.prototype._when = function _when(action) {
	        taskQueue.add(new Continuation(action, this));
	    };

	    Rejected.prototype._runAction = function _runAction(action) {
	        if (action.rejected(this)) {
	            errorHandler.untrack(this);
	        }
	    };

	    return Rejected;
	})();

	var Never = (function () {
	    function Never() {
	        build_Promise___classCallCheck(this, Never);
	    }

	    Never.prototype.then = function then() {
	        return this;
	    };

	    Never.prototype['catch'] = function _catch() {
	        return this;
	    };

	    Never.prototype.map = function map() {
	        return this;
	    };

	    Never.prototype.ap = function ap() {
	        return this;
	    };

	    Never.prototype.chain = function chain() {
	        return this;
	    };

	    Never.prototype.concat = function concat(b) {
	        return b;
	    };

	    Never.prototype.toString = function toString() {
	        return '[object ' + this.inspect() + ']';
	    };

	    Never.prototype.inspect = function inspect() {
	        return 'Promise { never }';
	    };

	    Never.prototype.state = function state() {
	        return PENDING | NEVER;
	    };

	    Never.prototype.near = function near() {
	        return this;
	    };

	    Never.prototype._when = function _when() {};

	    Never.prototype._runAction = function _runAction() {};

	    return Never;
	})();

	Future.prototype.constructor = Fulfilled.prototype.constructor = Rejected.prototype.constructor = Never.prototype.constructor = Future;

	// -------------------------------------------------------------
	// ## Creating promises
	// -------------------------------------------------------------

	// resolve :: Thenable e a -> Promise e a
	// resolve :: a -> Promise e a

	function resolve(x) {
	    return isPromise(x) ? x.near() : maybeThenable(x) ? refForMaybeThenable(fulfill, x) : new Fulfilled(x);
	}

	// reject :: e -> Promise e a

	function reject(e) {
	    return new Rejected(e);
	}

	// never :: Promise e a

	function never() {
	    return new Never();
	}

	// fulfill :: a -> Promise e a

	function fulfill(x) {
	    return new Fulfilled(x);
	}

	// future :: () -> { resolve: Resolve e a, promise: Promise e a }
	// type Resolve e a = a|Thenable e a -> ()

	function future() {
	    var promise = new Future();
	    return { resolve: function resolve(x) {
	            return promise._resolve(x);
	        }, promise: promise };
	}

	// -------------------------------------------------------------
	// ## Iterables
	// -------------------------------------------------------------

	// all :: Iterable (Promise e a) -> Promise e [a]

	function all(promises) {
	    var handler = new Merge(allHandler, resultsArray(promises));
	    return iterablePromise(handler, promises);
	}

	var allHandler = {
	    merge: function merge(ref, args) {
	        ref._fulfill(args);
	    }
	};

	// race :: Iterable (Promise e a) -> Promise e a

	function race(promises) {
	    return iterablePromise(new Race(never), promises);
	}

	function isIterable(x) {
	    return typeof x === 'object' && x !== null;
	}

	function iterablePromise(handler, iterable) {
	    if (!isIterable(iterable)) {
	        return reject(new TypeError('expected an iterable'));
	    }

	    var p = new Future();
	    return resolveIterable(resolveMaybeThenable, handler, iterable, p);
	}

	// -------------------------------------------------------------
	// # Internals
	// -------------------------------------------------------------

	// isPromise :: * -> boolean
	function isPromise(x) {
	    return x != null && typeof x === 'object' && x.constructor === Future;
	}

	function resolveMaybeThenable(x) {
	    return isPromise(x) ? x.near() : refForMaybeThenable(fulfill, x);
	}

	function refForMaybeThenable(otherwise, x) {
	    try {
	        var then = x.then;
	        return typeof then === 'function' ? extractThenable(then, x) : otherwise(x);
	    } catch (e) {
	        return new Rejected(e);
	    }
	}

	function extractThenable(then, thenable) {
	    var p = new Future();

	    try {
	        then.call(thenable, function (x) {
	            return p._resolve(x);
	        }, function (e) {
	            return p._reject(e);
	        });
	    } catch (e) {
	        p._reject(e);
	    }

	    return p.near();
	}

	function cycle() {
	    return new Rejected(new TypeError('resolution cycle'));
	}

	var Continuation = (function () {
	    function Continuation(action, ref) {
	        build_Promise___classCallCheck(this, Continuation);

	        this.action = action;
	        this.ref = ref;
	    }

	    Continuation.prototype.run = function run() {
	        this.ref._runAction(this.action);
	    };

	    return Continuation;
	})();

	exports.resolve = resolve;
	exports.reject = reject;
	exports.future = future;
	exports.never = never;
	exports.fulfill = fulfill;
	exports.all = all;
	exports.race = race;

	'use strict';

	function _delay___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var _delay = function (ms, p, promise) {
	    p._runAction(new Delay(ms, promise));
	    return promise;
	}

	var Delay = (function () {
	    function Delay(time, promise) {
	        _delay___classCallCheck(this, Delay);

	        this.time = time;
	        this.promise = promise;
	    }

	    Delay.prototype.fulfilled = function fulfilled(p) {
	        /*global setTimeout*/
	        setTimeout(become, this.time, p, this.promise);
	    };

	    Delay.prototype.rejected = function rejected(p) {
	        this.promise._become(p);
	    };

	    return Delay;
	})();

	function become(p, promise) {
	    promise._become(p);
	}

	'use strict';

	function TimeoutError___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	function TimeoutError___inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var TimeoutError = (function (_Error) {
	    TimeoutError___inherits(TimeoutError, _Error);

	    function TimeoutError(message) {
	        TimeoutError___classCallCheck(this, TimeoutError);

	        _Error.call(this);
	        this.message = message;
	        this.name = TimeoutError.name;
	        /* istanbul ignore else */
	        if (typeof Error.captureStackTrace === 'function') {
	            Error.captureStackTrace(this, TimeoutError);
	        }
	    }

	    return TimeoutError;
	})(Error);

	'use strict';

	function _timeout___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var _timeout = function (ms, p, promise) {
	    var timer = setTimeout(rejectOnTimeout, ms, promise);
	    p._runAction(new Timeout(timer, promise));
	    return promise;
	}

	var Timeout = (function () {
	    function Timeout(timer, promise) {
	        _timeout___classCallCheck(this, Timeout);

	        this.timer = timer;
	        this.promise = promise;
	    }

	    Timeout.prototype.fulfilled = function fulfilled(p) {
	        clearTimeout(this.timer);
	        this.promise._become(p);
	    };

	    Timeout.prototype.rejected = function rejected(p) {
	        clearTimeout(this.timer);
	        this.promise._become(p);
	        return false;
	    };

	    return Timeout;
	})();

	function rejectOnTimeout(promise) {
	    promise._reject(new TimeoutError('promise timeout'));
	}

	'use strict';

	function Any___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var Any = (function () {
	    function Any() {
	        Any___classCallCheck(this, Any);

	        this.done = false;
	        this.pending = 0;
	    }

	    Any.prototype.valueAt = function valueAt(x, i, promise) {
	        promise._fulfill(x);
	    };

	    Any.prototype.fulfillAt = function fulfillAt(p, i, promise) {
	        promise._become(p);
	    };

	    Any.prototype.rejectAt = function rejectAt(p, i, promise) {
	        silenceError(p);
	        this.check(this.pending - 1, promise);
	    };

	    Any.prototype.complete = function complete(total, promise) {
	        this.done = true;
	        this.check(this.pending + total, promise);
	    };

	    Any.prototype.check = function check(pending, promise) {
	        this.pending = pending;
	        if (this.done && pending === 0) {
	            promise._reject(new RangeError('No fulfilled promises in input'));
	        }
	    };

	    return Any;
	})();

	'use strict';

	function Settle___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var Settle = (function () {
	    function Settle(resolve, results) {
	        Settle___classCallCheck(this, Settle);

	        this.done = false;
	        this.pending = 0;
	        this.results = results;
	        this.resolve = resolve;
	    }

	    Settle.prototype.valueAt = function valueAt(x, i, promise) {
	        this.settleAt(this.resolve(x), i, promise);
	    };

	    Settle.prototype.fulfillAt = function fulfillAt(p, i, promise) {
	        this.settleAt(p, i, promise);
	    };

	    Settle.prototype.rejectAt = function rejectAt(p, i, promise) {
	        silenceError(p);
	        this.settleAt(p, i, promise);
	    };

	    Settle.prototype.settleAt = function settleAt(p, i, promise) {
	        this.results[i] = p;
	        this.check(this.pending - 1, promise);
	    };

	    Settle.prototype.complete = function complete(total, promise) {
	        this.done = true;
	        this.check(this.pending + total, promise);
	    };

	    Settle.prototype.check = function check(pending, promise) {
	        this.pending = pending;
	        if (this.done && pending === 0) {
	            promise._fulfill(this.results);
	        }
	    };

	    return Settle;
	})();

	'use strict';

	var _runPromise = _runPromise__runPromise;

	function _runPromise__runPromise(f, thisArg, args, promise) {

	    function resolve(x) {
	        promise._resolve(x);
	    }

	    function reject(e) {
	        promise._reject(e);
	    }

	    switch (args.length) {
	        case 0:
	            f.call(thisArg, resolve, reject);break;
	        case 1:
	            f.call(thisArg, args[0], resolve, reject);break;
	        case 2:
	            f.call(thisArg, args[0], args[1], resolve, reject);break;
	        case 3:
	            f.call(thisArg, args[0], args[1], args[2], resolve, reject);break;
	        default:
	            args.push(resolve, reject);
	            f.apply(thisArg, args);
	    }

	    return promise;
	}

	'use strict';

	var _runNode = _runNode__runNode;

	function _runNode__runNode(f, thisArg, args, promise) {

	    function settleNode(e, x) {
	        if (e) {
	            promise._reject(e);
	        } else {
	            promise._fulfill(x);
	        }
	    }

	    switch (args.length) {
	        case 0:
	            f.call(thisArg, settleNode);break;
	        case 1:
	            f.call(thisArg, args[0], settleNode);break;
	        case 2:
	            f.call(thisArg, args[0], args[1], settleNode);break;
	        case 3:
	            f.call(thisArg, args[0], args[1], args[2], settleNode);break;
	        default:
	            args.push(settleNode);
	            f.apply(thisArg, args);
	    }

	    return promise;
	}

	'use strict';

	function _runCoroutine___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var _runCoroutine = function (refFor, iterator, promise) {
	    coStep(refFor, iterator.next, void 0, iterator, promise);
	    return promise;
	}

	function coStep(refFor, continuation, x, iterator, promise) {
	    try {
	        handle(refFor, continuation.call(iterator, x), iterator, promise);
	    } catch (e) {
	        promise._reject(e);
	    }
	}

	function handle(refFor, result, iterator, promise) {
	    if (result.done) {
	        return promise._resolve(result.value);
	    }

	    refFor(result.value)._runAction(new Next(refFor, iterator, promise));
	}

	var Next = (function () {
	    function Next(refFor, iterator, promise) {
	        _runCoroutine___classCallCheck(this, Next);

	        this.refFor = refFor;
	        this.iterator = iterator;
	        this.promise = promise;
	    }

	    Next.prototype.fulfilled = function fulfilled(ref) {
	        var iterator = this.iterator;
	        coStep(this.refFor, iterator.next, ref.value, iterator, this.promise);
	    };

	    Next.prototype.rejected = function rejected(ref) {
	        var iterator = this.iterator;
	        coStep(this.refFor, iterator['throw'], ref.value, iterator, this.promise);
	        return true;
	    };

	    return Next;
	})();

	'use strict';

	function main___inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	function main___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	function coroutine(generator) {
	    return function () {
	        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	            args[_key] = arguments[_key];
	        }

	        return runGenerator(generator, this, args);
	    };
	}

	function runGenerator(generator, thisArg, args) {
	    var iterator = generator.apply(thisArg, args);
	    return _runCoroutine(resolve, iterator, new Future());
	}

	// -------------------------------------------------------------
	// ## Node-style async
	// -------------------------------------------------------------

	// type Nodeback e a = e -> a -> ()
	// type NodeApi e a = ...* -> Nodeback e a -> ()

	// fromNode :: NodeApi e a -> (...args -> Promise e a)
	// Turn a Node API into a promise API

	function fromNode(f) {
	    return function () {
	        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	            args[_key2] = arguments[_key2];
	        }

	        return runNodeResolver(f, this, args, new Future());
	    };
	}

	// runNode :: NodeApi e a -> ...* -> Promise e a
	// Run a Node API, returning a promise for the outcome

	function main__runNode(f) {
	    for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
	        args[_key3 - 1] = arguments[_key3];
	    }

	    return runNodeResolver(f, this, args, new Future());
	}

	function runNodeResolver(f, thisArg, args, p) {
	    checkFunction(f);

	    try {
	        _runNode(f, thisArg, args, p);
	    } catch (e) {
	        p._reject(e);
	    }
	    return p;
	}

	// -------------------------------------------------------------
	// ## Make a promise
	// -------------------------------------------------------------

	// type Resolve e a = a|Thenable e a -> ()
	// type Reject e = e -> ()
	// type Producer e a = (...* -> Resolve e a -> Reject e -> ())
	// runPromise :: Producer e a -> ...* -> Promise e a

	function main__runPromise(f) {
	    for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
	        args[_key4 - 1] = arguments[_key4];
	    }

	    return runResolver(f, this, args, new Future());
	}

	function runResolver(f, thisArg, args, p) {
	    checkFunction(f);

	    try {
	        _runPromise(f, thisArg, args, p);
	    } catch (e) {
	        p._reject(e);
	    }
	    return p;
	}

	// -------------------------------------------------------------
	// ## Time
	// -------------------------------------------------------------

	// delay :: number -> Promise e a -> Promise e a

	function delay(ms, x) {
	    var p = resolve(x);
	    return ms <= 0 || isRejected(p) || isNever(p) ? p : _delay(ms, p, new Future());
	}

	// timeout :: number -> Promise e a -> Promise (e|TimeoutError) a

	function timeout(ms, x) {
	    var p = resolve(x);
	    return isSettled(p) ? p : _timeout(ms, p, new Future());
	}

	// -------------------------------------------------------------
	// ## Iterables
	// -------------------------------------------------------------

	// any :: Iterable (Promise e a) -> Promise e a

	function any(promises) {
	    return iterablePromise(new Any(), promises);
	}

	// settle :: Iterable (Promise e a) -> Promise e [Promise e a]

	function settle(promises) {
	    var handler = new Settle(resolve, resultsArray(promises));
	    return iterablePromise(handler, promises);
	}

	// -------------------------------------------------------------
	// ## Lifting
	// -------------------------------------------------------------

	// merge :: (...* -> b) -> ...Promise e a -> Promise e b

	function main__merge(f) {
	    for (var _len5 = arguments.length, args = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
	        args[_key5 - 1] = arguments[_key5];
	    }

	    return runMerge(f, this, args);
	}

	function runMerge(f, thisArg, args) {
	    var handler = new Merge(new MergeHandler(f, thisArg), resultsArray(args));
	    return iterablePromise(handler, args);
	}

	var MergeHandler = (function () {
	    function MergeHandler(f, c) {
	        main___classCallCheck(this, MergeHandler);

	        this.f = f;
	        this.c = c;
	        this.promise = void 0;
	        this.args = void 0;
	    }

	    MergeHandler.prototype.merge = function merge(promise, args) {
	        this.promise = promise;
	        this.args = args;
	        taskQueue.add(this);
	    };

	    MergeHandler.prototype.run = function run() {
	        try {
	            this.promise._resolve(this.f.apply(this.c, this.args));
	        } catch (e) {
	            this.promise._reject(e);
	        }
	    };

	    return MergeHandler;
	})();

	function checkFunction(f) {
	    if (typeof f !== 'function') {
	        throw new TypeError('must provide a resolver function');
	    }
	}

	// -------------------------------------------------------------
	// ## ES6 Promise polyfill
	// -------------------------------------------------------------

	var NOARGS = [];

	// type Resolve a = a -> ()
	// type Reject e = e -> ()
	// Promise :: (Resolve a -> Reject e) -> Promise e a

	var CreedPromise = (function (_Future) {
	    main___inherits(CreedPromise, _Future);

	    function CreedPromise(f) {
	        main___classCallCheck(this, CreedPromise);

	        _Future.call(this);
	        runResolver(f, void 0, NOARGS, this);
	    }

	    return CreedPromise;
	})(Future);

	CreedPromise.resolve = resolve;
	CreedPromise.reject = reject;
	CreedPromise.all = all;
	CreedPromise.race = race;

	function shim() {
	    var orig = typeof Promise === 'function' && Promise;

	    /* istanbul ignore if */
	    if (typeof self !== 'undefined') {
	        self.Promise = CreedPromise;
	        /* istanbul ignore else */
	    } else if (typeof global !== 'undefined') {
	            global.Promise = CreedPromise;
	        }

	    return orig;
	}

	if (typeof Promise !== 'function') {
	    shim();
	}

	exports.coroutine = coroutine;
	exports.fromNode = fromNode;
	exports.runNode = main__runNode;
	exports.runPromise = main__runPromise;
	exports.delay = delay;
	exports.timeout = timeout;
	exports.any = any;
	exports.settle = settle;
	exports.merge = main__merge;
	exports.shim = shim;
	exports.Promise = CreedPromise;

}));