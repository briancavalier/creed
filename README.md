# creed :: async

Sophisticated and functionally-minded async with advanced features: coroutines, promises, ES2015 iterables, [fantasy-land](https://github.com/fantasyland/fantasy-land).

Creed simplifies async by letting you write coroutines using ES2015 generators and promises, and encourages functional programming via fantasy-land.  It also makes uncaught errors obvious by default, and supports other ES2015 features such as iterables.

<a href="http://promises-aplus.github.com/promises-spec"><img width="82" height="82" alt="Promises/A+" src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png"></a>
<a href="https://github.com/fantasyland/fantasy-land"><img width="82" height="82" alt="Fantasy Land" src="https://raw.github.com/puffnfresh/fantasy-land/master/logo.png"></a>
[![Build Status](https://travis-ci.org/briancavalier/creed.svg?branch=master)](https://travis-ci.org/briancavalier/creed)

## Example

Using creed coroutines, ES2015, and FP to solve the [async-problem](https://github.com/plaid/async-problem):

```javascript
'use strict';

import { runNode, all, coroutine } from 'creed';
import { readFile } from 'fs';
import { join } from 'path';

// joinPath :: String -> String -> String
const joinPath = init => tail => join(init, tail);

// readFileP :: String -> String -> Promise Error Buffer
const readFileP = encoding => file => runNode(readFile, file, {encoding});

// pipe :: (a -> b) -> (b -> c) -> (a -> c)
const pipe = (f, g) => x => g(f(x));

// concatFiles :: String -> Promise Error String
const concatFiles = coroutine(function* (dir) {
    const readUtf8P = pipe(joinPath(dir), readFileP('utf8'));

    const index = yield readUtf8P('index.txt');
    const results = yield all(index.match(/^.*(?=\n)/gm).map(readUtf8P));
    return results.join('');
});

const main = process => concatFiles(process.argv[2])
    .then(s => process.stdout.write(s));

main(process);
```

## Get it

`npm install --save creed`

`bower install --save creed`

As a module:

```js
// ES2015
import { resolve, reject, all, ... } from 'creed';

// Node/CommonJS
var creed = require('creed');

// AMD
define(['creed'], function(creed) { ... });
```

As `window.creed`:

```html
<!-- Browser global: window.creed -->
<script src="creed/dist/creed.js"></script>
```

## Try it

Creed is REPL friendly, with instant and obvious feedback. [Try it out in JSBin](https://jsbin.com/muzoba/edit?js,console) or [using ES2015 with babel](https://jsbin.com/faxene/edit?js,console), or try it in a REPL:

Note that ES2015 [`import` currently doesn't work in `babel-node`](https://github.com/babel/babel/issues/1264).  Use `let` + `require` instead.

```
npm install creed
npm install -g babel-node
babel-node
> let { resolve, delay, all, race } = require('creed');
'use strict'
> resolve('hello');
Promise { fulfilled: hello }
> all([1, 2, 3].map(resolve));
Promise { fulfilled: 1,2,3 }
> let p = delay(1000, 'done!'); p
Promise { pending }
... wait 1 second ...
> p
Promise { fulfilled: done! }
> race([delay(100, 'no'), 'winner']);
Promise { fulfilled: winner }
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
        let profileUrl = yield getUserProfileUrlFromDB(userId);
        let text = yield fetchTextFromUrl(profileUrl);
        return text;
    } catch(e) {
        return getDefaultText();
    }
});

// Call it
getUserProfile(123)
    .then(profile => console.log(profile));
```

### fromNode :: NodeApi e a &rarr; (...* &rarr; Promise e a)
type NodeApi e a = ...* &rarr; Nodeback e a &rarr; ()<br/>
type Nodeback e a = e &rarr; a &rarr; ()

Turn a Node API into a promise API

```js
import { fromNode } from 'creed';
import { readFile } from 'fs';

// Make a promised version of fs.readFile
let readFileP = fromNode(readFile);

readFileP('theFile.txt', 'utf8')
    .map(String) // fs.readFile produces a Buffer, transform to a String
    .then(contents => console.log(contents));
```

### runNode :: NodeApi e a &rarr; ...* &rarr; Promise e a
type NodeApi e a = ...* &rarr; Nodeback e a &rarr; ()<br/>
type Nodeback e a = e &rarr; a &rarr; ()

Run a Node API and return a promise for its result.

```js
import { runNode } from 'creed';
import { readFile } from 'fs';

runNode(readFile, 'theFile.txt', 'utf8')
    .map(String) // fs.readFile produces a Buffer, transform to a String
    .then(contents => console.log(contents));
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
    xhr.addEventListener("error", reject);
    xhr.addEventListener("load", resolve);
    xhr.open("GET", url);
    xhr.send(null);
}, 'http://...'); // inject url parameter

p.then(result => console.log(result));
```

Parameter threading also makes it easy to create reusable tasks
that don't rely on closures and scope chain capturing.

```js
import { runPromise } from 'creed';

function xhrGet(url, resolve, reject) => {
    var xhr = new XMLHttpRequest;
    xhr.addEventListener("error", reject);
    xhr.addEventListener("load", resolve);
    xhr.open("GET", url);
    xhr.send(null);
}

runPromise(xhrGet, 'http://...')
    .then(result => console.log(result));
```

### merge :: (...* -> b) -> ...Promise e a -> Promise e b

Merge promises by passing their fulfillment values to a merge
function.  Returns a promise for the result of the merge function.
Effectively liftN for promises.

```js
import { merge, resolve } from 'creed';

merge((x, y) => x + y, resolve(123), resolve(1))
    .then(z => console.log(z)); //=> 124
```

## Make promises

### future :: () &rarr; { resolve: Resolve e a, promise: Promise e a }
type Resolve e a = a|Thenable e a &rarr; ()<br/>

Create a `{ resolve, promise }` pair, where `resolve` is a function that seals the fate of `promise`.

```js
import { future, reject } from 'creed';

// Fulfill
let { resolve, promise } = future();
resolve(123);
promise.then(x => console.log(x)); //=> 123

// Resolve to another promise
let anotherPromise = ...;
let { resolve, promise } = future();
resolve(anotherPromise); //=> make promise's fate the same as anotherPromise's

// Reject
let { resolve, promise } = future();
resolve(reject(new Error('oops')));
promise.catch(e => console.log(e)); //=> [Error: oops]
```

### resolve :: a|Thenable e a &rarr; Promise e a

Coerce a value or Thenable to a promise.

```js
import { resolve } from 'creed';

resolve(123)
    .then(x => console.log(x)); //=> 123

resolve(resolve(123))
    .then(x => console.log(x)); //=> 123
    
resolve(jQuery.get('http://...')) // coerce any thenable
    .then(x => console.log(x)); //=> 123
```

### fulfill :: a &rarr; Promise e a

Lift a value into a promise.

```js
import { fulfill, resolve } from 'creed';

fulfill(123)
    .then(x => console.log(x)); //=> 123
    
// Note the difference from resolve
fulfill(fulfill(123))
    .then(x => console.log(x)); //=> '[object Promise { fulfilled: 123 }]'

resolve(fulfill(123))
    .then(x => console.log(x)); //=> 123
```

### reject :: Error e => e &rarr; Promise e a

Make a rejected promise for an error.

```js
import { reject } from 'creed';

reject(new TypeError('oops!'))
    .catch(e => console.log(e.message)); //=> oops!
```

### never :: Promise e a

Make a promise that remains pending forever.

```js
import { never } from 'creed';

never()
    .then(x => console.log(x)); // nothing logged, ever
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
    .then(y => console.log(y)); //=> 2

resolve(1)
    .then(x => resolve(x + 1)) // return transformed promise
    .then(y => console.log(y)); //=> 2
```

### .catch :: Promise e a &rarr; (e &rarr; b|Promise e b) &rarr; Promise e b

Catch and handle a promise error.

```js
import { reject, resolve } from 'creed';

reject(new Error('oops!'))
    .catch(e => 123) // recover by returning a new value
    .then(x => console.log(x)); //=> 123

reject(new Error('oops!'))
    .catch(e => resolve(123)) // recover by returning a promise
    .then(x => console.log(x)); //=> 123
```

### .map :: Promise e a &rarr; (a &rarr; b) &rarr; Promise e b

[Fantasy-land Functor](https://github.com/fantasyland/fantasy-land#functor).
Transform a promise's value by applying a function.  The return
value of the function will be used verbatim, even if it is a promise.
Returns a new promise for the transformed value.

```js
import { resolve } from 'creed';

resolve(1)
    .map(x => x + 1) // return a transformed value
    .then(y => console.log(y)); //=> 2
```

### .ap :: Promise e (a &rarr; b) &rarr; Promise e a &rarr; Promise e b

[Fantasy-land Apply](https://github.com/fantasyland/fantasy-land#apply).
Apply a promised function to a promised value.  Returns a new promise
for the result.

```js
import { resolve } from 'creed';

resolve(x => x + 1)
    .ap(resolve(123))
    .then(y => console.log(y)); //=> 124

resolve(x => y => x+y)
    .ap(resolve(1))
    .ap(resolve(123))
    .then(y => console.log(y)); //=> 124
```

### .chain :: Promise e a &rarr; (a &rarr; Promise e b) &rarr; Promise e b

[Fantasy-land Chain](https://github.com/fantasyland/fantasy-land#chain).
Sequence async actions.  When a promise fulfills, run another
async action and return a promise for its result.

```js
let profileText = getUserProfileUrlFromDB(userId)
    .chain(fetchTextFromUrl);

profileText.then(text => console.log(text)); //=> <user profile text>
```

### .concat :: Promise e a &rarr; Promise e a &rarr; Promise e a

[Fantasy-land Semigroup](https://github.com/fantasyland/fantasy-land#semigroup).
Returns a promise equivalent to the *earlier* of two promises

```js
import { delay } from 'creed';

delay(200, 'bar').concat(delay(100, 'foo'))
    .then(x => console.log(x)); //=> 'foo'
```

## Control time

### delay :: Int &rarr; a|Promise e a &rarr; Promise e a

Create a delayed promise for a value, or further delay the fulfillment
of an existing promise.  Delay only delays fulfillment: it has no
effect on rejected promises.

```js
import { delay, reject } from 'creed';

delay(5000, 'hi')
    .then(x => console.log(x)); //=> 'hi' after 5 seconds

delay(5000, delay(1000, 'hi'))
    .then(x => console.log(x)); //=> 'hi' after 6 seconds

delay(5000, reject(new Error('oops')))
    .catch(e => console.log(e.message)); //=> 'oops' immediately
```

### timeout :: Int &rarr; Promise e a &rarr; Promise e a

Create a promise that will reject after a specified time unless
it settles earlier.

```js
import { delay } from 'creed';

timeout(2000, delay(1000, 'hi'))
    .then(x => console.log(x)); //=> 'hi' after 1 second

timeout(1000, delay(2000, 'hi')); //=> TimeoutError after 1 second
```

## Resolve Iterables

### all :: Iterable (Promise e a) &rarr; Promise e [a]

Await all promises from an Iterable.  Returns a promise that fulfills
with an array containing all input promise fulfillment values,
or rejects if at least one input promise rejects.

```js
import { all, resolve } from 'creed';

all([resolve(123), resolve(456)])
    .then(x => console.log(x)); //=> [123, 456]

let promises = new Set();
promises.add(resolve(123));
promises.add(resolve(456));

all(promises)
    .then(x => console.log(x)); //=> [123, 456]
```

### race :: Iterable (Promise e a) &rarr; Promise e a

Returns a promise equivalent to the input promise that *settles* earliest.
If there are input promises that are already settled or settle
simultaneously, race prefers the one encountered first in the
iteration order.

**Note:** As per the ES6-spec, racing an empty iterable returns `never()`

### any :: Iterable (Promise e a) &rarr; Promise e a

Returns a promise equivalent to the input promise that *fulfills*
earliest.  If all input promises reject, the returned promise rejects.

### settle :: Iterable (Promise e a) &rarr; Promise e [Promise e a]

Returns a promise that fulfills with an array of settled promises.

```js
import { settle, resolve, reject, isFulfilled, getValue } from 'creed';

// Find all the fulfilled promises in an iterable
settle([resolve(123), reject(new Error('oops')), resolve(456)])
    .map(settled => {
        return settled.filter(isFulfilled).map(getValue);
    })
    .then(fulfilled => console.log(fulfilled.join(','))); //=> 123,456
```

## Inspect

### isFulfilled :: Promise e a &rarr; boolean

Returns true if the promise is fulfilled.

```js
import { isFulfilled, resolve, reject, delay, never } from 'creed';

isFulfilled(resolve(123));        //=> true
isFulfilled(reject(new Error())); //=> false
isFulfilled(delay(0, 123));       //=> true
isFulfilled(delay(1, 123));       //=> false
isFulfilled(never());             //=> false
```

### isRejected :: Promise e a &rarr; boolean

Returns true if the promise is rejected.

```js
import { isRejected, resolve, reject, delay, never } from 'creed';

isRejected(resolve(123));        //=> false
isRejected(reject(new Error())); //=> true
isRejected(delay(0, 123));       //=> false
isRejected(delay(1, 123));       //=> false
isRejected(never());             //=> false
```

### isSettled :: Promise e a &rarr; boolean

Returns true if the promise is either fulfilled or rejected.

```js
import { isSettled, resolve, reject, delay, never } from 'creed';

isSettled(resolve(123));        //=> true
isSettled(reject(new Error())); //=> true
isSettled(delay(0, 123));       //=> true
isSettled(delay(1, 123));       //=> false
isSettled(never());             //=> false
```

### isPending :: Promise e a &rarr; boolean

Returns true if the promise is pending (not yet fulfilled or rejected).

```js
import { isPending, resolve, reject, delay, never } from 'creed';

isPending(resolve(123));        //=> false
isPending(reject(new Error())); //=> false
isPending(delay(0, 123));       //=> false
isPending(delay(1, 123));       //=> true
isPending(never());             //=> true
```

### isNever :: Promise e a &rarr; boolean

Returns true if it is known that the promise will remain pending
forever.  In practice, this means that the promise is one that was
returned by `never()` or a promise that has been resolved to such.

```js
import { isNever, resolve, reject, delay, never, race } from 'creed';

isNever(resolve(123));         //=> false
isNever(reject(new Error()));  //=> false
isNever(delay(0, 123));        //=> false
isNever(delay(1, 123));        //=> false
isNever(never());              //=> true
isNever(resolve(never()));     //=> true
isNever(delay(1000, never())); //=> true
isNever(race([]));             //=> true
```

### getValue :: Promise e a &rarr; a

Extract the value of a *fulfilled* promise.  Throws if called on a
pending or rejected promise, so check first with `isFulfilled`.

```js
import { getValue, resolve, reject, never } from 'creed';

getValue(resolve(123)); //=> 123
getValue(reject());     //=> throws TypeError
getValue(never());      //=> throws TypeError
```

### getReason :: Promise e a &rarr; e

Extract the reason of a *rejected* promise.  Throws if called on a
pending or fulfilled promise, so check first with `isRejected`.

```js
import { getReason, isFulfilled, resolve, reject, never } from 'creed';

getReason(resolve(123));      //=> throws TypeError
getReason(reject('because')); //=> 'because'
getReason(never());           //=> throws TypeError
```

## Polyfill

### shim :: () &rarr; PromiseConstructor|undefined

Polyfill the global `Promise` constructor with an ES6-compliant
creed `Promise`.  If there was a pre-existing global `Promise`,
it is returned.

```js
import { shim } from 'creed';

// Install creed's ES2015-compliant Promise as global
let NativePromise = shim();

// Create a creed promise
Promise.resolve(123);
```
