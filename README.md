# creed :: async

[![Join the chat at https://gitter.im/briancavalier/creed](https://badges.gitter.im/briancavalier/creed.svg)](https://gitter.im/briancavalier/creed?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Sophisticated and functionally-minded async with advanced features: coroutines, promises, ES2015 iterables, [fantasy-land](#fantasy-land).

Creed simplifies async by letting you write coroutines using ES2015 generators and promises, and encourages functional programming via fantasy-land.  It also makes uncaught errors obvious by default, and supports other ES2015 features such as iterables.

You can also use [babel](https://babeljs.io) and the [babel-creed-async](https://github.com/briancavalier/babel-creed-async) plugin to write ES7 `async` functions backed by creed coroutines.

<a href="http://promises-aplus.github.com/promises-spec"><img width="82" height="82" alt="Promises/A+" src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png"></a>
<a href="https://github.com/fantasyland/fantasy-land"><img width="82" height="82" alt="Fantasy Land" src="https://raw.github.com/puffnfresh/fantasy-land/master/logo.png"></a>
[![Build Status](https://travis-ci.org/briancavalier/creed.svg?branch=master)](https://travis-ci.org/briancavalier/creed)
[![Coverage Status](https://coveralls.io/repos/briancavalier/creed/badge.svg?branch=master&service=github)](https://coveralls.io/github/briancavalier/creed?branch=master)

## Example

Using creed coroutines, ES2015, and FP to solve the [async-problem](https://github.com/plaid/async-problem):

```javascript
import { runNode, all, coroutine } from 'creed'
import { readFile } from 'fs'
import { join } from 'path'

// joinPath :: String -> String -> String
const joinPath = init => tail => join(init, tail)

// readFileP :: String -> String -> Promise Error Buffer
const readFileP = encoding => file => runNode(readFile, file, {encoding})

// pipe :: (a -> b) -> (b -> c) -> (a -> c)
const pipe = (f, g) => x => g(f(x))

// concatFiles :: String -> Promise Error String
const concatFiles = coroutine(function* (dir) {
    const readUtf8P = pipe(joinPath(dir), readFileP('utf8'))

    const index = yield readUtf8P('index.txt')
    const results = yield all(index.match(/^.*(?=\n)/gm).map(readUtf8P))
    return results.join('')
})

const main = process => concatFiles(process.argv[2])
    .then(s => process.stdout.write(s))

main(process)
```

## Get it

`npm install --save creed`

`bower install --save creed`

As a module:

```js
// ES2015
import { resolve, reject, all, ... } from 'creed';

// Node/CommonJS
var creed = require('creed')

// AMD
define(['creed'], function(creed) { ... })
```

As `window.creed`:

```html
<!-- Browser global: window.creed -->
<script src="creed/dist/creed.js"></script>
```

## Try it

Creed will work anywhere ES5 works. Here's how to try it.

Creed is REPL friendly, with instant and obvious feedback. [Try it out in JSBin](https://jsbin.com/muzoba/edit?js,console) or [using ES2015 with babel](https://jsbin.com/faxene/edit?js,console), or try it in a REPL:

Note that although babel supports ES2015 `import` statements, [the `babel-node` REPL doesn't](https://github.com/babel/babel/issues/1264).  Use `let` + `require` in the REPL instead.

```
npm install creed
npm install -g babel-node
babel-node
> let { resolve, delay, all, race } = require('creed')
'use strict'
> resolve('hello')
Promise { fulfilled: hello }
> all([1, 2, 3].map(resolve))
Promise { fulfilled: 1,2,3 }
> let p = delay(1000, 'done!'); p
Promise { pending }
... wait 1 second ...
> p
Promise { fulfilled: done! }
> race([delay(100, 'no'), 'winner'])
Promise { fulfilled: winner }
```

# Errors & debugging

By design, uncaught creed promise errors are fatal.  They will crash your program, forcing you to fix or [`.catch`](#catch--promise-e-a--e--bpromise-e-b--promise-e-b) them.  You can override this behavior by [registering your own error event listener](#debug-events).
  
Consider this small program, which contains a `ReferenceError`.

```js
import { all, runNode } from 'creed';
import { readFile } from 'fs';

const readFileP = file => runNode(readFile, file)

const readFilesP = files => all(files.map(readFileP))

const append = (head, tail) => head + fail; // Oops, typo will throw ReferenceError

// Calling append() from nested promise causes
// a ReferenceError, but it is not being caught
readFilesP(process.argv.slice(2))
    .map(contents => contents.reduce(append, ''))
    .then(s => console.log(s))
```

Running this program (e.g. using `babel-node`) causes a fatal error, exiting the process with a stack trace:
 
```
> babel-node experiments/errors.js file1 file2 ...
/Users/brian/Projects/creed/dist/creed.js:672
		throw value;
		^

ReferenceError: fail is not defined
    at append (/Users/brian/Projects/creed/experiments/errors.js:8:39)
    at Array.reduce (native)
    at readFilesP.map.contents (/Users/brian/Projects/creed/experiments/errors.js:13:31)
    at tryCall (/Users/brian/Projects/creed/dist/creed.js:344:12)
    at Map.fulfilled (/Users/brian/Projects/creed/dist/creed.js:408:3)
    at Fulfilled._runAction (/Users/brian/Projects/creed/dist/creed.js:945:10)
    at Future.run (/Users/brian/Projects/creed/dist/creed.js:871:5)
    at TaskQueue._drain (/Users/brian/Projects/creed/dist/creed.js:131:8)
    at /Users/brian/Projects/creed/dist/creed.js:117:53
    at _combinedTickCallback (internal/process/next_tick.js:67:7)
```

## Async traces

**Experimental: V8 only**

Fatal stack traces are helpful, but sometimes they aren't enough.  Enable _async traces_ for stack traces for even more detail.

**Note:** Enabling async traces is typically an application-level concern.  Libraries that use creed *should not* enable them in dist builds.

Running the example above with async traces enabled yields a more helpful trace. Notably:
 
- asynchronous stack frames are shown: both the point at which map is called and the point in the mapping function (which is called asynchronous) are shown.
- the Map operation is called out specifically
- stack frames from within creed are omitted

```
> CREED_DEBUG=1 babel-node experiments/errors.js file1 file2 ...
/Users/brian/Projects/creed/dist/creed.js:672
		throw value;
		^

ReferenceError: fail is not defined
    at append (/Users/brian/Projects/creed/experiments/errors.js:8:39)
    at Array.reduce (native)
    at readFilesP.map.contents (/Users/brian/Projects/creed/experiments/errors.js:13:31)
 from Map:
    at Object.<anonymous> (/Users/brian/Projects/creed/experiments/errors.js:13:6)
    at loader (/Users/brian/Projects/creed/node_modules/babel-register/lib/node.js:144:5)
    at Object.require.extensions.(anonymous function) [as .js] (/Users/brian/Projects/creed/node_modules/babel-register/lib/node.js:154:7)
```

### Enabling async traces

Enable async traces by:

* `NODE_ENV=development` or `NODE_ENV=test` - async traces will be enabled automatically.
* `CREED_DEBUG=1` (or any non-empty string) - enables async traces even if NODE_ENV=production or NODE_ENV not set.
* [`enableAsyncTraces()`](#enableasynctraces----) - programatically enable async traces, e.g. for browsers, etc. where env vars aren't available.
    * [`disableAsyncTraces()`](#disableasynctraces----) - programatically disable async traces.

### Performance impact
    
Async traces typically have about a 3-4x impact on performance.

That may be just fine for some applications, while not for others.  Be sure to assess your application performance needs and budget before running with async traces enabled in production.

## Debug events

Creed supports global `window` events in browsers, and `process` events in Node, similar to Node's `'uncaughtException'` event. This allows applications to register a handler to receive events from all promise implementations that support these global events.

Errors passed to unhandled rejection event handlers will have [async traces](#async-traces) if they are enabled.

The events are:

* `'unhandledRejection'`: fired when an unhandled rejection is detected
* `'rejectionHandled'`: fired when rejection previously reported via an '`unhandledRejection'` event becomes handled

## Node global process events

The following example shows how to use global `process` events in Node.js to implement simple debug output.  The parameters passed to the `process` event handlers:

* `reason` - the rejection reason, typically an `Error` instance.
* `promise` - the promise that was rejected.  This can be used to correlate corresponding `unhandledRejection` and `rejectionHandled` events for the same promise.

```js
process.on('unhandledRejection', reportRejection)
process.on('rejectionHandled', reportHandled)

function reportRejection(error, promise) {
	// Implement whatever logic your application requires
	// Log or record error state, etc.
}

function reportHandled(promise) {
	// Implement whatever logic your application requires
	// Log that error has been handled, etc.
}
```

## Browser window events

The following example shows how to use global `window` events in browsers to implement simple debug output.  The `event` object has the following extra properties:

* `event.detail.reason` - the rejection reason (typically an `Error` instance)
* `event.detail.promise` - the promise that was rejected.  This can be used to correlate corresponding `unhandledRejection` and `rejectionHandled` events for the same promise.

```js
window.addEventListener('unhandledRejection', event => {
	// Calling preventDefault() suppresses default rejection logging
	// in favor of your own.
	event.preventDefault()
	reportRejection(event.detail.reason, event.detail.promise)
}, false)

window.addEventListener('rejectionHandled', event => {
	// Calling preventDefault() suppresses default rejection logging
	// in favor of your own.
	event.preventDefault()
	reportHandled(event.detail.promise)
}, false)

function reportRejection(error, promise) {
	// Implement whatever logic your application requires
	// Log or record error state, etc.
}

function reportHandled(promise) {
	// Implement whatever logic your application requires
	// Log that error has been handled, etc.
}
```

# API

## Run async tasks

### coroutine :: Generator a &rarr; (...* &rarr; Promise e a)

Create an async coroutine from a promise-yielding generator.

```js
import { coroutine } from 'creed';

function fetchTextFromUrl(url) {
    // Fetch the text and return a promise for it
    return promise;
}

// Make an async coroutine from a generator
let getUserProfile = coroutine(function* (userId) {
    try {
        let profileUrl = yield getUserProfileUrlFromDB(userId)
        let text = yield fetchTextFromUrl(profileUrl)
        return text;
    } catch(e) {
        return getDefaultText()
    }
})

// Call it
getUserProfile(123)
    .then(profile => console.log(profile))
```

### fromNode :: NodeApi e a &rarr; (...* &rarr; Promise e a)
type NodeApi e a = ...* &rarr; Nodeback e a &rarr; ()<br/>
type Nodeback e a = e &rarr; a &rarr; ()

Turn a Node API into a promise API

```js
import { fromNode } from 'creed';
import { readFile } from 'fs';

// Make a promised version of fs.readFile
let readFileP = fromNode(readFile)

readFileP('theFile.txt', 'utf8')
    .then(contents => console.log(contents))
```

### runNode :: NodeApi e a &rarr; ...* &rarr; Promise e a
type NodeApi e a = ...* &rarr; Nodeback e a &rarr; ()<br/>
type Nodeback e a = e &rarr; a &rarr; ()

Run a Node API and return a promise for its result.

```js
import { runNode } from 'creed';
import { readFile } from 'fs';

runNode(readFile, 'theFile.txt', 'utf8')
    .then(contents => console.log(contents))
```

### runPromise :: Producer e a &rarr; ...* &rarr; Promise e a
type Producer e a = (...* &rarr; Resolve e a &rarr; Reject e &rarr; ())<br/>
type Resolve e a = a|Thenable e a &rarr; ()<br/>
type Reject e = e &rarr; ()

Run a function to produce a promised result.

```js
import { runPromise } from 'creed';

/* Run a function, threading in a url parameter */
let p = runPromise((url, resolve, reject) => {
    var xhr = new XMLHttpRequest;
    xhr.addEventListener("error", reject)
    xhr.addEventListener("load", resolve)
    xhr.open("GET", url)
    xhr.send(null)
}, 'http://...') // inject url parameter

p.then(result => console.log(result))
```

Parameter threading also makes it easy to create reusable tasks
that don't rely on closures and scope chain capturing.

```js
import { runPromise } from 'creed';

function xhrGet(url, resolve, reject) => {
    var xhr = new XMLHttpRequest;
    xhr.addEventListener("error", reject)
    xhr.addEventListener("load", resolve)
    xhr.open("GET", url)
    xhr.send(null)
}

runPromise(xhrGet, 'http://...')
    .then(result => console.log(result))
```

### merge :: (...* &rarr; b) &rarr; ...Promise e a &rarr; Promise e b

Merge promises by passing their fulfillment values to a merge
function.  Returns a promise for the result of the merge function.
Effectively liftN for promises.

```js
import { merge, resolve } from 'creed';

merge((x, y) => x + y, resolve(123), resolve(1))
    .then(z => console.log(z)) //=> 124
```

## Make promises

### future :: () &rarr; { resolve: Resolve e a, promise: Promise e a }
type Resolve e a = a|Thenable e a &rarr; ()<br/>

Create a `{ resolve, promise }` pair, where `resolve` is a function that seals the fate of `promise`.

```js
import { future, reject } from 'creed';

// Fulfill
let { resolve, promise } = future()
resolve(123)
promise.then(x => console.log(x)) //=> 123

// Resolve to another promise
let anotherPromise = ...;
let { resolve, promise } = future()
resolve(anotherPromise) //=> make promise's fate the same as anotherPromise's

// Reject
let { resolve, promise } = future()
resolve(reject(new Error('oops')))
promise.catch(e => console.log(e)) //=> [Error: oops]
```

### resolve :: a|Thenable e a &rarr; Promise e a

Coerce a value or Thenable to a promise.

```js
import { resolve } from 'creed';

resolve(123)
    .then(x => console.log(x)) //=> 123

resolve(resolve(123))
    .then(x => console.log(x)) //=> 123
    
resolve(jQuery.get('http://...')) // coerce any thenable
    .then(x => console.log(x)) //=> 123
```

### fulfill :: a &rarr; Promise e a

Lift a value into a promise.

```js
import { fulfill, resolve } from 'creed';

fulfill(123)
    .then(x => console.log(x)) //=> 123
    
// Note the difference from resolve
fulfill(fulfill(123))
    .then(x => console.log(x)) //=> '[object Promise { fulfilled: 123 }]'

resolve(fulfill(123))
    .then(x => console.log(x)) //=> 123
```

### reject :: Error e => e &rarr; Promise e a

Make a rejected promise for an error.

```js
import { reject } from 'creed';

reject(new TypeError('oops!'))
    .catch(e => console.log(e.message)) //=> oops!
```

### never :: Promise e a

Make a promise that remains pending forever.

```js
import { never } from 'creed';

never()
    .then(x => console.log(x)) // nothing logged, ever
```

Note: `never` consumes virtually no resources.  It does not hold references
to any functions passed to `then`, `map`, `chain`, etc. 

## Transform promises

### .then :: Promise e a &rarr; (a &rarr; b|Promise e b) &rarr; Promise e b

[Promises/A+ then](http://promisesaplus.com/).
Transform a promise's value by applying a function to the
promise's fulfillment value. Returns a new promise for the
transformed result.

```js
import { resolve } from 'creed';

resolve(1)
    .then(x => x + 1) // return a transformed value
    .then(y => console.log(y)) //=> 2

resolve(1)
    .then(x => resolve(x + 1)) // return transformed promise
    .then(y => console.log(y)) //=> 2
```

### .catch :: Promise e a &rarr; (e &rarr; b|Promise e b) &rarr; Promise e b

Catch and handle a promise error.

```js
import { reject, resolve } from 'creed';

reject(new Error('oops!'))
    .catch(e => 123) // recover by returning a new value
    .then(x => console.log(x)) //=> 123

reject(new Error('oops!'))
    .catch(e => resolve(123)) // recover by returning a promise
    .then(x => console.log(x)) //=> 123
```

### .map :: Promise e a &rarr; (a &rarr; b) &rarr; Promise e b

Transform a promise's value by applying a function.  The return
value of the function will be used verbatim, even if it is a promise.
Returns a new promise for the transformed value.

```js
import { resolve } from 'creed';

resolve(1)
    .map(x => x + 1) // return a transformed value
    .then(y => console.log(y)) //=> 2
```

### .bimap :: Promise e a &rarr; (e &rarr; f) &rarr; (a &rarr; b) &rarr; Promise f b

[Fantasy-land Functor](https://github.com/fantasyland/fantasy-land#bifunctor).
Transform a promise's error or value by applying functions to either.  The
first function will be applied to the error of a rejected promise, and
the second function will be applied to the value of a fulfilled promise.
Like `map`, the return value of the applied function will be used verbatim,
even if it is a promise. Returns a new promise for the transformed value.

```js
import { resolve, reject } from 'creed';

resolve(1)
    .bimap(e => new Error('not called'), x => x + 1) // transform value
    .then(y => console.log(y)) //=> 2

reject(new Error('oops'))
    .bimap(e => new Error(e.message + '!!!'), x => x + 1) // transform error
    .catch(e => console.log(e)) //=> Error: oops!!!
```

### .ap :: Promise e (a &rarr; b) &rarr; Promise e a &rarr; Promise e b

Apply a promised function to a promised value.  Returns a new promise
for the result.

```js
import { resolve } from 'creed';

resolve(x => x + 1)
    .ap(resolve(123))
    .then(y => console.log(y)) //=> 124

resolve(x => y => x+y)
    .ap(resolve(1))
    .ap(resolve(123))
    .then(y => console.log(y)) //=> 124
```

### .chain :: Promise e a &rarr; (a &rarr; Promise e b) &rarr; Promise e b

Sequence async actions.  When a promise fulfills, run another
async action and return a promise for its result.

```js
let profileText = getUserProfileUrlFromDB(userId)
    .chain(fetchTextFromUrl)

profileText.then(text => console.log(text)) //=> <user profile text>
```

### .or :: Promise e a &rarr; Promise e a &rarr; Promise e a
### (deprecated) .concat :: Promise e a &rarr; Promise e a &rarr; Promise e a

**Note:** The name `concat` is deprecated, use `or` instead.

Returns a promise equivalent to the *earlier* of two promises. Preference is given to the callee promise in the case that both promises have already settled.

```js
import { delay, fulfill } from 'creed';

delay(200, 'bar').or(delay(100, 'foo'))
    .then(x => console.log(x)); //=> 'foo'

fulfill(123).or(fulfill(456))
    .then(x => console.log(x)); //=> 123
```

## Control time

### delay :: Int &rarr; a|Promise e a &rarr; Promise e a

Create a delayed promise for a value, or further delay the fulfillment
of an existing promise.  Delay only delays fulfillment: it has no
effect on rejected promises.

```js
import { delay, reject } from 'creed';

delay(5000, 'hi')
    .then(x => console.log(x)) //=> 'hi' after 5 seconds

delay(5000, delay(1000, 'hi'))
    .then(x => console.log(x)) //=> 'hi' after 6 seconds

delay(5000, reject(new Error('oops')))
    .catch(e => console.log(e.message)) //=> 'oops' immediately
```

### timeout :: Int &rarr; Promise e a &rarr; Promise e a

Create a promise that will reject after a specified time unless
it settles earlier.

```js
import { delay } from 'creed';

timeout(2000, delay(1000, 'hi'))
    .then(x => console.log(x)) //=> 'hi' after 1 second

timeout(1000, delay(2000, 'hi')) //=> TimeoutError after 1 second
```

## Resolve Iterables

Creed's iterable functions accept any ES2015 Iterable.  Most of
the examples in this section show Arrays, but Sets, generators,
etc. will work as well.

### all :: Iterable (Promise e a) &rarr; Promise e [a]

Await all promises from an Iterable.  Returns a promise that fulfills
with an array containing all input promise fulfillment values,
or rejects if at least one input promise rejects.

```js
import { all, resolve } from 'creed';

all([resolve(123), resolve(456)])
    .then(x => console.log(x)) //=> [123, 456]

let promises = new Set()
promises.add(resolve(123))
promises.add(resolve(456))

all(promises)
    .then(x => console.log(x)) //=> [123, 456]

function *generator() {
    yield resolve(123)
    yield resolve(456)
}

all(generator())
    .then(x => console.log(x)) //=> [123, 456]
```

### race :: Iterable (Promise e a) &rarr; Promise e a

Returns a promise equivalent to the input promise that *settles* earliest.

If there are input promises that are already settled or settle
simultaneously, race prefers the one encountered first in the
iteration order.

Note the differences from `any()`.

**Note:** As per the ES6-spec, racing an empty iterable returns `never()`

```js
import { race, resolve, reject, delay, isNever } from 'creed';

race([delay(100, 123), resolve(456)])
    .then(x => console.log(x)) //=> 456

race([resolve(123), reject(456)])
    .then(x => console.log(x)) //=> 123

race([delay(100, 123), reject(new Error('oops'))])
    .catch(e => console.log(e)) //=> [Error: oops]

isNever(race([])) //=> true
```

### any :: Iterable (Promise e a) &rarr; Promise e a

Returns a promise equivalent to the input promise that *fulfills*
earliest.  If all input promises reject, the returned promise rejects.

If there are input promises that are already fulfilled or fulfill
simultaneously, any prefers the one encountered first in the
iteration order.

Note the differences from `race()`.

```js
import { any, resolve, reject, delay, isNever } from 'creed';

any([delay(100, 123), resolve(456)])
    .then(x => console.log(x)); //=> 456

any([resolve(123), reject(456)])
    .then(x => console.log(x)) //=> 123

any([reject(456), resolve(123)])
    .then(x => console.log(x)); //=> 123

any([delay(100, 123), reject(new Error('oops'))])
    .catch(e => console.log(e)); //=> 123

any([reject(new Error('foo')), reject(new Error('bar'))])
    .catch(e => console.log(e)) //=> [RangeError: No fulfilled promises in input]

any([])
    .catch(e => console.log(e)) //=> [RangeError: No fulfilled promises in input]
```

### settle :: Iterable (Promise e a) &rarr; Promise e [Promise e a]

Returns a promise that fulfills with an array of settled promises.

```js
import { settle, resolve, reject, isFulfilled, getValue } from 'creed';

// Find all the fulfilled promises in an iterable
settle([resolve(123), reject(new Error('oops')), resolve(456)])
    .map(settled => settled.filter(isFulfilled).map(getValue))
    .then(fulfilled => console.log(fulfilled)) //=> [ 123, 456 ]
```

## Inspect

### isFulfilled :: Promise e a &rarr; boolean

Returns true if the promise is fulfilled.

```js
import { isFulfilled, resolve, reject, delay, never } from 'creed';

isFulfilled(resolve(123))        //=> true
isFulfilled(reject(new Error())) //=> false
isFulfilled(delay(0, 123))       //=> true
isFulfilled(delay(1, 123))       //=> false
isFulfilled(never())             //=> false
```

### isRejected :: Promise e a &rarr; boolean

Returns true if the promise is rejected.

```js
import { isRejected, resolve, reject, delay, never } from 'creed';

isRejected(resolve(123))        //=> false
isRejected(reject(new Error())) //=> true
isRejected(delay(0, 123))       //=> false
isRejected(delay(1, 123))       //=> false
isRejected(never())             //=> false
```

### isSettled :: Promise e a &rarr; boolean

Returns true if the promise is either fulfilled or rejected.

```js
import { isSettled, resolve, reject, delay, never } from 'creed';

isSettled(resolve(123))        //=> true
isSettled(reject(new Error())) //=> true
isSettled(delay(0, 123))       //=> true
isSettled(delay(1, 123))       //=> false
isSettled(never())             //=> false
```

### isPending :: Promise e a &rarr; boolean

Returns true if the promise is pending (not yet fulfilled or rejected).

```js
import { isPending, resolve, reject, delay, never } from 'creed';

isPending(resolve(123))        //=> false
isPending(reject(new Error())) //=> false
isPending(delay(0, 123))       //=> false
isPending(delay(1, 123))       //=> true
isPending(never())             //=> true
```

### isNever :: Promise e a &rarr; boolean

Returns true if it is known that the promise will remain pending
forever.  In practice, this means that the promise is one that was
returned by `never()` or a promise that has been resolved to such.

```js
import { isNever, resolve, reject, delay, never, race } from 'creed';

isNever(resolve(123))         //=> false
isNever(reject(new Error()))  //=> false
isNever(delay(0, 123))        //=> false
isNever(delay(1, 123))        //=> false
isNever(never())              //=> true
isNever(resolve(never()))     //=> true
isNever(delay(1000, never())) //=> true
isNever(race([]))             //=> true
```

### getValue :: Promise e a &rarr; a

Extract the value of a *fulfilled* promise.  Throws if called on a
pending or rejected promise, so check first with `isFulfilled`.

```js
import { getValue, resolve, reject, never } from 'creed';

getValue(resolve(123)) //=> 123
getValue(reject())     //=> throws TypeError
getValue(never())      //=> throws TypeError
```

### getReason :: Promise e a &rarr; e

Extract the reason of a *rejected* promise.  Throws if called on a
pending or fulfilled promise, so check first with `isRejected`.

```js
import { getReason, resolve, reject, never } from 'creed';

getReason(resolve(123))      //=> throws TypeError
getReason(reject('because')) //=> 'because'
getReason(never())           //=> throws TypeError
```

## Debugging

### enableAsyncTraces :: () &rarr; ()

Enable [async traces](#async-traces).  Can be called at any time, but will only trace promises created *after* it's called.  If called multiple times, *resets* the tracing state each time.

### disableAsyncTraces :: () &rarr; ()

Disable [async traces](#async-traces).

## Polyfill

### shim :: () &rarr; PromiseConstructor|undefined

Polyfill the global `Promise` constructor with an ES6-compliant
creed `Promise`.  If there was a pre-existing global `Promise`,
it is returned.

```js
import { shim } from 'creed';

// Install creed's ES2015-compliant Promise as global
let NativePromise = shim()

// Create a creed promise
Promise.resolve(123)
```

## Fantasy Land

Creed implements Fantasy Land 2.1:

* [Functor](https://github.com/fantasyland/fantasy-land#functor)
* [Bifunctor](https://github.com/fantasyland/fantasy-land#bifunctor)
* [Apply](https://github.com/fantasyland/fantasy-land#apply)
* [Applicative](https://github.com/fantasyland/fantasy-land#applicative)
* [Alt](https://github.com/fantasyland/fantasy-land#alt)
* [Plus](https://github.com/fantasyland/fantasy-land#plus)
* [Alternative](https://github.com/fantasyland/fantasy-land#alternative)
* [Chain](https://github.com/fantasyland/fantasy-land#chain)
* [Monad](https://github.com/fantasyland/fantasy-land#monad)
* [Semigroup](https://github.com/fantasyland/fantasy-land#semigroup)
* [Monoid](https://github.com/fantasyland/fantasy-land#monoid)

