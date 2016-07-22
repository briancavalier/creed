Creed features cancellation with a cancellation token based approach.

It is modelled after [this promise cancellation proposal](https://github.com/bergus/promise-cancellation),
altough minor discrepancies might be possible (if you find anything, please report a bug).

# Terminology

1. A **cancellation token** (**`CancelToken`**) is an object with methods for determining whether and when an operation should be cancelled.
2. The cancellation can be **requested** by the issuer of the `CancelToken`, denoting that the result of an operation is no longer of interest
   and that the operation should be terminated if applicable.
3. A **cancelled token** is a `CancelToken` that represents a requested cancellation
4. A **cancellation reason** is a value used to request a cancellation and reject the respective promises.
5. One `CancelToken` might be **associated** with a promise.
6. A **cancelled promise** is a promise that got rejected because its cancellation was requested through its associated token
7. The **corresponding** cancellation token of a handler is the associated token of the promise that the handler is meant to resolve
8. A **cancelled callback** is an `onFulfilled` or `onRejected` handler whose corresponding cancellation token has been cancelled.
   It might be considered an **unregistered** or **ignored** callback.

# Cancelling…

Cancellation allows you to stop asynchronous operations built with promises. Use cases might both be in programmatical cancellation, where your program stops doing things after e.g. a timeout has expired or another operation has finished earlier, and in interactive cancellation, where a user triggers the stop through input methods.

Operations that are supposed to be stoppable must support this explicitly. It is not desired that anyone who holds a promise can cancel the operation that computes the result, therefore the invoker of the operation has to pass in a cancellation token that only he can request the cancellation.
Passing around this capability explicitly can be a bit verbose at times, but everything else is done by Creed for you.

## …Promises

A promise can be cancelled through a cancellation token at any time before it is fulfilled or rejected. For this, the token is associated with the promise. The `new Promise` constructor, the `future` factory and the `resolve` function support this via an optional parameter:
```javascript
import { future, Promise, CancelToken } from 'creed';

const token = new CancelToken(…);
var cancellablePromise = new Promise(…, token);
var cancellableFuture = future(token);
var cancellableResolution = resolve(…, token);
```
Many of the builtin methods also return promises that have a cancellation token associated with them.

The token that is associated with a promise cannot be changed or removed afterwards (see [`CancelToken.reference`](#canceltokenreference--canceltoken-r--reference-r) for an alternative).
When the cancellation is requested, all promises that are associated to the token become immediately rejected unless they are already settled.
The rejection reason will be the one that is given as the reason to the cancellation request.
Notice that even promises that already have been resolved to another promise but are still not settled will be cancelled:
```javascript
import { delay, CancelToken } from 'creed';

const { token, cancel } = CancelToken.source();
delay(3000, 'over').then(cancel);

const { promise, resolve } = future(token);
resolve(delay(5000, 'result'));
promise.then(x => console.log(x), e => console.log(e)); //=> 'over' after 3 seconds
```

If you want to associate a token to an already existing promise, you can use the `.untilCancel(token)` method, although this is rarely necessary.

## …Callbacks

The most important feature to avoid unnecessary work and to ignore the results of any promise is to prevent callbacks from running.
The main [transformation methods](README.md#transform-promises) (`then`, `catch`, `map`, `ap`, `chain`) have an optional token parameter for this in Creed.
The cancellation token is registered together with the callback that are to be executed when the promise fulfills or rejects.
As soon as the cancellation is requested, the respective callbacks are guaranteed not to be invoked any more (even when the promise is already fulfilled or rejected). The callbacks are "unregistered" or "cancelled" through this.

The passed token is associated with the returned promise.
```javascript
import { delay, CancelToken } from 'creed';

const { token, cancel } = CancelToken.source();
delay(3000, 'over').then(cancel);

const p = delay(1000).chain(x => delay(4000, 'result'), token);
// the token is associated with p, so despite p being resolved with the delay we get
p.then(x => console.log(x), e => console.log(e)); //=> 'over' after 3 seconds

const q = delay(4000).chain(x => {
	console.log('never executed');
	return delay(1000, 'result');
}, token);
// the token being cancelled prevents the inner delay from ever being created, and we get
q.then(x => console.log(x), e => console.log(e)); //=> 'over' after 3 seconds
```

### Usage

As a rule of thumb, take

> You will normally want to pass the token
>
> * to every asynchronous function you call
> * to every transformation method you invoke
>
> or in short, to everything that returns a promise

A typical function might therefore look like
```javascript
function load(url, token) {
	return fetch(url, token)
		.then(response => response.readText(token), token)
		.map(JSON.parse, token)
		.then(d => getDetails(d.result, token), token)
		.catch(e => reject(new WrapError('fetching problem', e)), token);
}
```
When the cancellation is requested, every promise in the chain (that is not already settled) will be rejected,
and at the same time none of the callbacks (that did not already run) will ever be executed.
If the caller of `load` does not intend to cancel it, he would just pass no `token` (or `undefined` or `null`) and the chain would not be cancellable.

If you want a strand of actions to run without being cancelled after they have begun, just omit the `token` for them.
Beware of the usage of `.catch` without a token however, it would catch the cancellation reason then, so if you need to deal with exceptions in there better nest:
```javascript
function notCancellable(…) {
	return …; // no token within here
}
function partiallyCancellable(…, token) {
	return … // use token here
		.chain(notCancellable, token)
		…; // and there
}
```

If an API you are calling does not support cancellation, you of course don't have to pass it a token either.
Just `resolve` it to a Creed promise and attach your callbacks with a token, which means the operation will continue but be ignored when cancellation is requested.

### finally

The `finally` method is a helper for ensuring a callback always gets called. It does work a bit like
```javascript
Promise.prototype.finally = function(f) {
	const g = () => resolve(f(this)).then(() => this)
	return this.then(g, g)
};
```
but in contrast to a regular `onRejected` handler without a token it does get called synchronously from a cancellation request on the associated token of `this`,
yielding the result of the `f` call to the canceller so that he might handle possible exceptions which otherwise are usually ignored.

You can use it for something like
```javascript
startSpinner();
const token = new CancelToken(showStopbutton);
const p = load('http://…', token)
p.finally(() => {
	stopSpinner();
	hideStopbutton();
}).then(showResult, showErrormessage, token);
```

### trifurcate

Sometimes you want to distinguish whether a promise was fulfilled, rejected, or cancelled through its associated token.
You could do it with synchronous inspection in a `finally` handler, but there is an easier way.
The `trifurcate` method is essentially equivalent to
```javascript
Promise.prototype.trifurcate = function(onFulfilled, onRejected, onCancelled) {
	return this.then(onFulfilled, r => (isCancelled(this) ? onCancelled : onRejected)(r));
};
```
You can use it for something like
```javascript
const token = new CancelToken(cancel => {
	setTimeout(cancel, 3000)
});
load('http://…', token).trifurcate(showResult, showErrormessage, showTimeoutmessage);
```

## …Coroutines

Coroutines work with cancellation as well. They simplify dealing with cancellation tokens just like they avoid callbacks.
The above example would read
```javascript
const load = coroutine(function* (url, token) {
	coroutince.cancel = token;
	try {
		const response = yield fetch(url, token);
		const d = JSON.parse(yield response.readText(token));
		return yield getDetails(d.result, token);
	} catch (e) {
		throw new WrapError('fetching problem', e));
	}
});
```
You still would have to pass the token to all promise-returning asynchronous function calls, but there are no callbacks any more that you have to register the token with.
Instead, the magic `coroutine.cancel` setter allows you to choose the cancellation token that is used while waiting for each `yield`ed promise.
If the cancellation is requested during the time a promise is awaited, the coroutine will abort and immediately return a completion from the `yield` expression that does only trigger `finally` blocks in the generator function. The promise returned by the coroutine will be rejected like if the token was associated to it.

This does allow for quite classical patterns:
```javascript
coroutine.cancel = token;
const conn = db.open();
try {
	… yield conn.query(…, token);
	return …
} finally {
	conn.close();
}
```
where the connection is always closed, even when the `token` is cancelled during the query.

It does also make it possible to react specifically to cancellation during a strand of execution in a coroutine:
```javascript
coroutine.cancel = token;
try {
	…
} finally {
	if (token.requested) {
		… // cancelled during a yield in the try block
	}
}
```

It is also possible to change the `coroutine.cancel` token during the execution of a coroutine:
```javascript
coroutine.cancel = token;
… // uses token here when yielding
coroutine.cancel = null;
… // not cancellable during this section
if (token.requested) …; // manually checking for cancellation
…
coroutine.cancel = token;
yield; // immediately abort if already cancelled
… // uses token here again
```
The end of the uncancellable section can also be combined into a single `yield coroutine.cancel = token;` statement.

On accessing, the magic `coroutine.cancel` getter returns the `CancelToken` that is associated with the promise returned by the coroutine.

# API

## Create tokens

### new CancelToken :: ((r &rarr; ()) &rarr; ()) &rarr; CancelToken r

Calls an executor callback with a function that allows to cancel the created `CancelToken`.

### CancelToken.source :: () &rarr; { cancel :: r &rarr; (), token :: CancelToken r }

Creates a `{ token, cancel }` pair where `token` is a new `CancelToken` and `cancel` is a function to request cancellation.

### CancelToken.for :: Thenable _ r &rarr; CancelToken r

Creates a cancellation token that is requested when the input promise fulfills.

### CancelToken.empty :: () &rarr; CancelToken _

Creates a cancellation token that is never requested, completing the [Fantasy-land Monoid](//github.com/fantasyland/fantasy-land#monoid).

## Subscribe

### .requested :: CancelToken r &rarr; boolean

Synchronously determines whether the cancellation has been requested.
```javascript
const { token, cancel } = CancelToken.source();
console.log(token.requested); //=> false
cancel();
console.log(token.requested); //=> true
```

### .getCancelled :: CancelToken r &rarr; Promise r _

Returns a promise with this token associated, i.e. one that rejects when the cancellation is requested. Allows for asynchronous subscription:
```javascript
const { token, cancel } = CancelToken.source();
token.getCancelled().then(null, e => console.log(e));
token.getCancelled().catch(e => console.log(e));
token.getCancelled().trifurcate(null, null, e => console.log(e));
cancel('reason');
//=> reason, reason, reason
```

### .subscribe :: CancelToken r &rarr; (r &rarr; a|Thenable e a) &rarr; Promise e a

Transforms the token's cancellation reason by applying the function to it.
Returns a promise for the transformed result.
The callback is invoked synchronously from a cancellation request, returning the promise also to the canceller.
If the token is already cancelled, the callback is invoked asynchronously.
```javascript
const { token, cancel } = CancelToken.source();
const p = token.subscribe(r => r + ' accepted');
const q = token.subscribe(r => { throw new Error(…); });
console.log(cancel('reason')); //=> [ Fulfilled { value: "reason accepted" }, Rejected { value: Error {…} } ]
p.then(x => console.log(x)); //=> reason accepted
```

### .subscribeOrCall :: CancelToken r &rarr; (r &rarr; a|Thenable e a) [&rarr; (...* &rarr; b)] &rarr; (...* &rarr; [b])

Subscribes the callback to be cancelled synchronously from a cancellation request or asynchronously when the token is already cancelled.
Returns a function that unsubscribes the callback.

Unless the callback has already been executed, if the optional second parameter is a function it will be invoked at most once with the unsubscription arguments.
```javascript
const { token, cancel } = CancelToken.source();
const a = token.subscribeOrCall(r => r + ' accepted', () => console.log('never executed'));
const b = token.subscribeOrCall(r => console.log('never executed'), x => console.log('executed ' + x));
const c = token.subscribeOrCall(r => { throw new Error(…); });
b('once'); //=> executed once
b('twice'); // nothing happens
console.log(cancel('reason')); //=> [ Fulfilled { value: "reason accepted" }, Rejected { value: Error {…} } ]
a(); // nothing happens
b(); // still nothing
```

This is an especially helpful tool in the promisification of cancellable APIs:
```javascript
import { Promise, reject, CancelToken } from 'creed';
function fetch(opts, token) {
	if (typeof opts == 'string') {
		opts = { method: 'GET', url: opts };
	}
	token = CancelToken.from(token) || CancelToken.never();
	return new Promise(resolve => {
		const xhr = new XMLHttpRequest();
		const nocancelAndResolve = token.subscribeOrCall(r => {
			xhr.abort(r);
		}, resolve);
		xhr.onload = () => nocancelAndResolve(fulfill(xhr.response));
		xhr.onerror = e => nocancelAndResolve(reject(e));
		xhr.open(opts.method, opts.url, true);
	}, token);
}
```

## Combine tokens

### .concat :: CancelToken r &rarr; CancelToken r &rarr; CancelToken r

[Fantasy-land Semigroup](https://github.com/fantasyland/fantasy-land#semigroup).
Returns a new cancellation token that is requested when the earlier of the two is requested.

### CancelToken.race :: Iterable (CancelToken r) &rarr; Race r

type Race r = { add :: CancelToken r &rarr; ... &rarr; (), get :: () &rarr; CancelToken r }

The function returns a `Race` object populated with the tokens from the iterable.

* The `add` method appends one or more tokens to the collection
* The `get` method returns a `CancelToken` that is cancelled with the reason of the first requested cancellation in the collection

Once the resulting token is cancelled, further `add` calls don't have any effect.

### CancelToken.pool :: Iterable (CancelToken r) &rarr; Pool r

type Pool r = { add :: CancelToken r &rarr; ... &rarr; (), get :: () &rarr; CancelToken r }

The function returns a `Pool` object populated with the tokens from the iterable.

* The `add` method appends one or more tokens to the collection
* The `get` method returns a `CancelToken` that is cancelled with an array of the reasons once all (but at least one) tokens in the collection have requested cancellation

Once the resulting token is cancelled, further `add` calls don't have any effect.

### CancelToken.reference :: [CancelToken r] &rarr; Reference r

type Reference r = { set :: [CancelToken r] &rarr; (), get :: () &rarr; CancelToken r }

The function returns a `Reference` object storing the token (or nothing) from the argument

* The `set` method puts a token or nothing (`null`, `undefined`) in the reference
* The `get` method returns a `CancelToken` that is cancelled with the reason of the current reference once cancellation is requested

Once the resulting token is cancelled, further `set` calls are forbidden.
