Latest results, using latest versions of modules:

	├── async@1.4.2
	├── bluebird@2.10.0
	├── co@4.6.0
	├── rsvp@3.1.0
	└── when@3.7.3

bench doxbee-sequential

	results for 10000 parallel executions, 1 ms per I/O op

	file                                 time(ms)  memory(MB)
	promises-creed-generator.js               193       27.86
	callbacks-baseline.js                     195       36.62
	promises-cujojs-when-generator.js         250       39.84
	promises-bluebird-generator.js            259       37.79
	promises-creed.js                         309       52.57
	promises-creed-algebraic.js               317       51.87
	promises-bluebird.js                      356       51.09
	promises-cujojs-when.js                   389       65.82
	promises-tildeio-rsvp.js                  436      101.56
	callbacks-caolan-async-waterfall.js       601      112.45
	promises-ecmascript6-native.js            818      184.12
	generators-tj-co.js                       915      146.75

	Platform info:
	Darwin 15.3.0 x64
	Node.JS 5.7.0
	V8 4.6.85.31
	Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench parallel (`--p 25`)

	results for 10000 parallel executions, 1 ms per I/O op

	file                                time(ms)  memory(MB)
	callbacks-baseline.js                    339       45.51
	promises-bluebird.js                     460       98.06
	promises-creed.js                        474      114.77
	promises-bluebird-generator.js           510      103.85
	promises-creed-generator.js              540      129.10
	promises-cujojs-when-generator.js        815      161.02
	promises-cujojs-when.js                  895      162.96
	callbacks-caolan-async-parallel.js       979      165.01
	promises-tildeio-rsvp.js                1437      392.05
	promises-ecmascript6-native.js          2062      523.50

	Platform info:
	Darwin 15.3.0 x64
	Node.JS 5.7.0
	V8 4.6.85.31
	Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench doxbee-errors

	results for 10000 parallel executions, 1 ms per I/O op
	Likelihood of rejection: 0.1

	file                                 time(ms)  memory(MB)
	callbacks-baseline.js                     204       34.14
	promises-creed-generator.js               222       34.51
	promises-bluebird-generator.js            278       37.73
	promises-creed-algebraic.js               344       53.66
	promises-creed.js                         349       54.45
	promises-bluebird.js                      403       56.14
	promises-cujojs-when.js                   474       74.50
	promises-tildeio-rsvp.js                  478       89.51
	callbacks-caolan-async-waterfall.js       608      112.39

	Platform info:
	Darwin 15.3.0 x64
	Node.JS 5.7.0
	V8 4.6.85.31
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
