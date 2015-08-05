
# API

## Notation

You'll see diagrams like:

```
promise1: ---a

promise2: ---X
```

These are timeline diagrams that try to give a simple, representative notion of how a promise behaves over time.  Time proceeds from left to right, using letters and symbols to indicate certain things:

* `-` - an instant in time where the promise is pending
* a,b,c,d,etc. - a promise fulfillment value at an instant in time
* `X` - a promise rejection at an instant in time
* `>` - promise remains pending forever

### Examples

`promise: ---a`

A promise that fulfills with `a` after some time

`promise: a`

A promise that is already fulfilled with `a`.

`promise: ---X`

A promise that rejects after some time

`promise: --->`

A promise that remains pending forever

## Make a promise

**coroutine :: Generator a -> (...args -> Promise a)**

Create an async coroutine from a promise-yielding generator.

```js
import { co } from 'creed';

function fetchTextFromUrl(url) {
    // ...
    return promise;
}

// Declare an async coroutine from a generator
let getUserProfile = coroutine(function* (user) {
    try {
        let profileUrl = yield getUserProfileUrlFromDB(user);
        let text = yield fetchTextFromUrl(profileUrl);
        return text;
    } catch(e) {
        return getDefaultText();
    }
});

// Call it like a function
let user = ...;
getUserProfile(user)
    .then(profile => console.log(profile));
```

### fromNode

####`fromNode :: (...args -> (err -> a)) -> (...args -> Promise a)`

Turn a Node-style API into a promised API.

```js
import { node } from 'creed';
import { readFile } from 'fs';

// Make a promised version of fs.readFile
let readFileP = fromNode(readFile);

readFileP('theFile.txt', 'utf8')
    .then(String) // fs.readFile returns a Buffer, transform to a String
    .then(contents => console.log(contents));
```

### runPromise

####`runPromise :: (...args -> (a -> ()) -> (err -> ()) -> ...args -> Promise a`

Run a function to produce a promised result.

```js
import { runPromise } from 'creed';

// Run a function, threading in a url parameter
let p = runPromise((url, resolve, reject) => {
    var xhr = new XMLHttpRequest;
    xhr.addEventListener("error", reject);
    xhr.addEventListener("load", resolve);
    xhr.open("GET", url);
    xhr.send(null);
}, 'http://...'); // inject url parameter

p.then(result => console.log(result));
```

Parameter threading also makes it easy to create reusable tasks that don't rely on closures and scope chain capturing.

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

## Transform

### then

####`then :: Promise a -> (a -> b|Promise b) -> Promise b`

[Promises/A+ then](http://promisesaplus.com/)

Transform a promise's value by applying a function to the promise's fulfillment value. Returns a new promise for the transformed result.

```
p:              ---1
p.then(x => 2): ---2

p:                        ---1
p.then(x => delay(3, 2)): ------2

p:                       ---1
p.then(x => reject(..)): ---X

p:         ---X
p.then(f): ---X
```

## Handle errors

### catch

####`catch :: Promise a -> (err -> b|Promise b) -> Promise b`

Recover from a promise error.

```
p:               ---X
p.catch(e => 1): ---1

p:                        ---X
p.catch(x => delay(3, 1)): ------1

p:          ---a
p.catch(f): ---a
```

## Control time

### timeout

####`timeout :: Milliseconds -> a|Promise a -> Promise a`

Reject a promise if it doesn't settle within a particular time.

```
p1:             ---a
timeout(5, p1): ---a

p2:             -----a
timeout(3, p2): --X
```

```js
import { timeout } from 'creed';
import rest from 'rest';

function getContentWithTimeout(url) {
    return timeout(1000, rest(url));
}

let content = getContentWithTimeout('http://...');
```

### delay

####`delay :: Milliseconds -> a|Promise a -> Promise a`

Make a promise that reveals it's fulfillment after a delay.  Rejections are not delayed.

```
p1:           ---a
delay(5, p1): --------a

p2:           ---X
delay(5, p2): ---X
```

```js
import { delay } from 'creed';

delay(1000, 'hi')
    .then(x => console.log(x)); // 'hi' after 1 second
    

function countdown(x) {
    console.log(x);
    
    return x === 0 ? x : delay(1000, x-1).then(countdown);
}

countdown(3);
```

```js
3 // immediately
2 // after 1 second
1 // after 2 seconds
0 // after 3 seconds
```

## Resolve collections

Creed's collection methods accept ES6 Iterables.  You can pass an Array, a Set, a Generator, etc. of promises.

### all

####`all :: Iterable Promise a -> Promise Array a`

Create a promise that fulfills when all input promises have fulfilled, or rejects when *one* input promise rejects.

```
p1:                --a
p2:                ------b
p3:                ----c
all([p1, p2, p3]): ------[a,b,c]

p1:                --a
p2:                ------b
p3:                ----X
all([p1, p2, p3]): ----X
```

```js
import { all, resolve } from 'creed';

let s = new Set();
s.add(resolve(1));
s.add(resolve(2));
s.add(resolve(3));

all(s).then(array => console.log(array)); // 1,2,3
```

```js
import { all, resolve } from 'creed';

function* yieldSomePromises() {
    yield resolve(1);
    yield resolve(2);
    yield resolve(3);
}

all(yieldSomePromises())
    .then(array => console.log(array)); // 1,2,3
```

### race

####`race :: Iterable Promise a -> Promise a`

A competitive race to settle. The returned promise will settle in the same way as the earliest promise in array to settle.

```
p1:                 --a
p2:                 ------X
p3:                 ----c
race([p1, p2, p3]): --a

p1:                 --X
p2:                 ------b
p3:                 ----c
race([p1, p2, p3]): --X

race([]):           ------->
```

```js
import { race, resolve, delay } from 'creed';

let a = [
    delay(100, 1),
    resolve(2),
    delay(200, 3)
];

race(a).then(x => console.log(x)); // 2
```

### any

####`any :: Iterable Promise a -> Promise a`

Create a promise that fulfills when the earliest input promise fulfills, or rejects when all input promises have rejected.

```
p1:                --X
p2:                ------b
p3:                ----c
any([p1, p2, p3]): ----c

p1:                --X
p2:                ------X
p3:                ----X
any([p1, p2, p3]): ------X

any([]):           X
```

```js
import { any } from 'creed';

let a = [
    reject(new Error('fail 1')),
    delay(100, 2),
    reject(new Error('fail 3')),
];

any(a).then(x => console.log(x)); // 2
```

### settle

####`settle :: Iterable Promise a -> Promise Array Promise a`

Create a promise that fulfills with an array of settled promises whose state and value can be inspected synchronously.

```
p1:                --a
p2:                ------b
p3:                ----c
all([p1, p2, p3]): ------[a,b,c]

p1:                --a
p2:                ------b
p3:                ----X
all([p1, p2, p3]): ----X
```

```js
import { settle, resolve, reject, isFulfilled, getValue } from 'creed';

let a = [reject(1), 2, resolve(3), reject(4)];

settle(a).then(array => {
    
    let fulfilled = array.filter(isFulfilled);
    
    for(let p of fulfilled) {
        console.log(getValue(p));
    }
    
});
```

## Debugging

*TODO*