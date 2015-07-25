Latest results, using latest versions of modules:

    ├── async@1.4.0
    ├── bluebird@2.9.34
    ├── co@4.6.0
    ├── rsvp@3.0.18
    └── when@3.7.3

bench doxbee-sequential

    results for 10000 parallel executions, 1 ms per I/O op

    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               149       36.42
    callbacks-baseline.js                     151       33.38
    promises-bluebird-generator.js            189       28.71
    promises-cujojs-when-generator.js         198       40.05
    promises-creed.js                         252       53.53
    promises-bluebird.js                      269       50.98
    promises-cujojs-when.js                   317       65.52
    promises-tildeio-rsvp.js                  335       72.00
    callbacks-caolan-async-waterfall.js       597      103.18
    promises-ecmascript6-native.js            787      188.16
    generators-tj-co.js                       845      148.72

    Platform info:
    Darwin 14.4.0 x64
    Node.JS 2.3.4
    V8 4.2.77.20
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench parallel (`--p 25`)

    results for 10000 parallel executions, 1 ms per I/O op

    file                                time(ms)  memory(MB)
    callbacks-baseline.js                    151       37.58
    promises-creed.js                        325      108.71
    promises-bluebird.js                     338      110.55
    promises-creed-generator.js              378      114.10
    promises-bluebird-generator.js           393      110.68
    promises-tildeio-rsvp.js                 534      216.73
    promises-cujojs-when-generator.js        600      165.27
    promises-cujojs-when.js                  621      166.20
    callbacks-caolan-async-parallel.js       775      211.05
    promises-ecmascript6-native.js          1738      533.20

    Platform info:
    Darwin 14.4.0 x64
    Node.JS 2.3.4
    V8 4.2.77.20
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench doxbee-errors

    results for 10000 parallel executions, 1 ms per I/O op
    Likelihood of rejection: 0.1
    
    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               172       36.45
    callbacks-baseline.js                     177       34.21
    promises-bluebird-generator.js            207       30.32
    promises-creed.js                         279       54.11
    promises-bluebird.js                      310       54.37
    promises-cujojs-when.js                   345       69.96
    promises-tildeio-rsvp.js                  379       77.64
    callbacks-caolan-async-waterfall.js       586      103.31

    Platform info:
    Darwin 14.4.0 x64
    Node.JS 2.3.4
    V8 4.2.77.20
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