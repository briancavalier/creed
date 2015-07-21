[![Build Status](https://travis-ci.org/briancavalier/creed.svg?branch=master)](https://travis-ci.org/briancavalier/creed)

# creed

Creed is a forward-looking promise kit with a novel architecture, focused API, and top-tier performance.

* Supports ES6 Iterables
* Async functions using ES6 Generators
* Fatal uncaught errors by default
* REPL friendly

## Get it

```
npm install creed
var creed = require('creed');
```

```
<script src="creed/dist/creed.js"></script>
```

## REPL Friendly

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
> creed.race([]);
Promise { never }
> creed.reject(new Error('instant stack traces for uncaught rejections'));
Promise { rejected: Error: instant stack traces for uncaught rejections }
> Error: instant stack traces for uncaught rejections
    at repl:1:14
    at REPLServer.defaultEval (repl.js:154:27)
    at bound (domain.js:254:14)
    at REPLServer.runBound [as eval] (domain.js:267:12)
    at REPLServer.<anonymous> (repl.js:308:12)
    at emitOne (events.js:82:20)
    at REPLServer.emit (events.js:169:7)
    at REPLServer.Interface._onLine (readline.js:210:10)
    at REPLServer.Interface._line (readline.js:549:8)
    at REPLServer.Interface._ttyWrite (readline.js:826:14)
```

