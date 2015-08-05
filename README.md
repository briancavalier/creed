[![Build Status](https://travis-ci.org/briancavalier/creed.svg?branch=master)](https://travis-ci.org/briancavalier/creed)

# creed :: async

Sophisticated and functionally-minded async with advanced features: coroutines, promises, ES2015 iterables, [fantasy-land](https://github.com/fantasyland/fantasy-land).

Creed simplifies async by letting you write coroutines using ES2015 generators and promises, and encourages functional programming via fantasy-land.  It also makes uncaught errors obvious by default, and supports other ES2105 features such as iterables.

* [Example](#example)
* [Try it](#try-it)
* [Get it](#get-it)
* [API docs](docs/api.md)

## Example

Using creed coroutines and FP to solve the [async-problem](https://github.com/plaid/async-problem):

```js
'use strict';

import { runNode, all, coroutine } from '../..';
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

### ES2015 (babel-node)

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
