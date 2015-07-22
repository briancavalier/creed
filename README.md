[![Build Status](https://travis-ci.org/briancavalier/creed.svg?branch=master)](https://travis-ci.org/briancavalier/creed)

# creed

Creed is a forward-looking promise kit optimized for developer happiness.  It has a 

* ES2015 Iterables
* Async functions via ES2015 Generators
* Fatal uncaught errors by default
* [REPL friendly](#repl-friendly)

## Get it

`npm install creed` or `bower install creed` or download from the `dist/` folder.

```js
// Babel ES2015
import { resolve, reject, all, ... } from 'creed';

// CommonJS
var creed = require('creed');

// AMD
define(['creed'], function(creed) { ... });
```

```html
<script src="creed/dist/creed.js"></script>
```

## Try it

Creed is REPL friendly, with instant and obvious feedback. [Try it out in JSBin](https://jsbin.com/muzoba/edit?js,console) or [using ES2015 with babel](https://jsbin.com/faxene/edit?js,console), or try it in a node REPL:

```
npm install creed
node
> var creed = require('creed');
undefined
> creed.resolve('hello');
Promise { fulfilled: hello }
> creed.all([1, 2, 3].map(creed.resolve));
Promise { fulfilled: 1,2,3 }
> var p = creed.delay(1000, 'done!'); p
Promise { pending }
... wait 1 second ...
> p
Promise { fulfilled: done! }
> creed.race([creed.delay(100, 'no'), 'winner']);
Promise { fulfilled: winner }
```

## Make a promise

### Using an async generator

```js
import { co } from 'creed';

function fetchTextFromUrl(url) {
    // ...
    return promise;
}

let getUserProfile = co(function* (user) {
    try {
        let profileUrl = yield getUserProfileUrlFromDB(user);
        let text = yield fetchTextFromUrl(profileUrl);
        return text;
    } catch(e) {
        return getDefaultText();
    }
});

let user = ...;
getUserProfile(user)
    .then(profile => console.log(profile));
```

### From a node API

```js
import { node } from 'creed';
import { readFile } from 'fs';

let readFilePromise = node(readFile);

readFile('theFile.txt', 'utf8')
    .then(String) // fs.readFile returns a Buffer, transform to a String
    .then(contents => console.log(contents));
```

### By running a task

```js
import { promise } from 'creed';

// Run a function, threading in a url parameter
let p = promise((url, resolve, reject) => {
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
function xhrGet(url, resolve, reject) => {
    var xhr = new XMLHttpRequest;
    xhr.addEventListener("error", reject);
    xhr.addEventListener("load", resolve);
    xhr.open("GET", url);
    xhr.send(null);
}

promise(xhrGet, 'http://...')
    .then(result => console.log(result));
```

