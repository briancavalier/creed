[![Build Status](https://travis-ci.org/briancavalier/creed.svg?branch=master)](https://travis-ci.org/briancavalier/creed)

# creed

Creed is a forward-looking promise toolkit.  It favors intuitiveness, productivity, and developer happiness. It has a small, focused API, makes uncaught errors obvious by default, and supports ES2105 features.

* [Try it](#try-it)
* [Get it](#get-it)
* [API docs](#api)

## Get it

`npm install --save creed`

`bower install --save creed`

```js
// ES2015
import { resolve, reject, all, ... } from 'creed';
```

```js
// Node/CommonJS
var creed = require('creed');
```

```js
// AMD
define(['creed'], function(creed) { ... });
```

```html
<!-- Browser global: window.creed -->
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
