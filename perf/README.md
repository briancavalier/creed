Latest results, using latest versions of modules:

├── async@2.0.0
├── bluebird@3.4.1
├── co@4.6.0
├── rsvp@3.2.1
└── when@3.7.7

bench doxbee-sequential

	results for 10000 parallel executions, 1 ms per I/O op

	file                                 time(ms)  memory(MB)
	callbacks-baseline.js                     103       30.72
	promises-creed-generator.js               196       33.27
	promises-creed.js                         239       47.87
	promises-creed-algebraic.js               240       49.70
	promises-bluebird-generator.js            247       37.48
	callbacks-caolan-async-waterfall.js       268       48.66
	promises-bluebird.js                      276       48.66
	promises-cujojs-when-generator.js         278       39.13
	promises-cujojs-when.js                   344       62.57
	promises-tildeio-rsvp.js                  426       74.50
	generators-tj-co.js                       968      134.20
	promises-ecmascript6-native.js           1064      183.98

	Platform info:
	Darwin 15.5.0 x64
	Node.JS 6.3.0
	V8 5.0.71.52
	Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench parallel (`--p 25`)

	results for 10000 parallel executions, 1 ms per I/O op

	file                                time(ms)  memory(MB)
	promises-creed.js                        401      118.38
	promises-creed-generator.js              456      116.59
	promises-bluebird.js                     484      101.09
	promises-bluebird-generator.js           532      102.83
	promises-cujojs-when.js                  753      160.36
	promises-cujojs-when-generator.js        816      163.04
	callbacks-caolan-async-parallel.js       825      201.21
	callbacks-baseline.js                    911       43.76
	promises-tildeio-rsvp.js                1546      386.39
	promises-ecmascript6-native.js          2107      454.37

	Platform info:
	Darwin 15.5.0 x64
	Node.JS 6.3.0
	V8 5.0.71.52
	Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench doxbee-errors

	results for 10000 parallel executions, 1 ms per I/O op
	Likelihood of rejection: 0.1

	file                                 time(ms)  memory(MB)
	callbacks-baseline.js                     128       30.35
	promises-creed-generator.js               221       32.26
	promises-creed.js                         277       48.73
	promises-bluebird-generator.js            282       36.62
	callbacks-caolan-async-waterfall.js       283       48.82
	promises-creed-algebraic.js               297       49.88
	promises-bluebird.js                      345       52.77
	promises-cujojs-when.js                   357       65.69
	promises-tildeio-rsvp.js                  476       87.50

	Platform info:
	Darwin 15.5.0 x64
	Node.JS 6.3.0
	V8 5.0.71.52
	Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

---

```
The MIT License (MIT)

Copyright (c) 2014 Petka Antonov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
