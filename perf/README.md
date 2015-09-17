Latest results, using latest versions of modules:

    ├── async@1.4.0
    ├── bluebird@2.9.34
    ├── co@4.6.0
    ├── rsvp@3.0.18
    └── when@3.7.3

bench doxbee-sequential

    results for 10000 parallel executions, 1 ms per I/O op

    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               133       27.81
    callbacks-baseline.js                     154       32.53
    promises-bluebird-generator.js            201       34.61
    promises-creed.js                         218       53.03
    promises-cujojs-when-generator.js         222       39.81
    promises-creed-algebraic.js               227       52.34
    promises-bluebird.js                      275       45.08
    promises-tildeio-rsvp.js                  321       70.31
    promises-cujojs-when.js                   355       62.78
    callbacks-caolan-async-waterfall.js       564      104.46
    promises-ecmascript6-native.js            781      188.33
    generators-tj-co.js                       813      143.26
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 4.0.0
    V8 4.5.103.30
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench parallel (`--p 25`)
    
    results for 10000 parallel executions, 1 ms per I/O op
    
    file                                time(ms)  memory(MB)
    promises-creed.js                        353       98.44
    promises-creed-generator.js              379      114.66
    promises-bluebird.js                     382      110.80
    promises-bluebird-generator.js           425       88.44
    callbacks-baseline.js                    461       37.88
    promises-tildeio-rsvp.js                 548      189.65
    promises-cujojs-when.js                  553      142.14
    promises-cujojs-when-generator.js        715      135.53
    callbacks-caolan-async-parallel.js       876      179.13
    promises-ecmascript6-native.js          1766      507.03
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 4.0.0
    V8 4.5.103.30
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench doxbee-errors

    results for 10000 parallel executions, 1 ms per I/O op
    Likelihood of rejection: 0.1
    
    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               162       26.76
    callbacks-baseline.js                     181       32.44
    promises-bluebird-generator.js            206       33.11
    promises-creed.js                         263       53.18
    promises-creed-algebraic.js               269       53.34
    promises-bluebird.js                      327       54.92
    promises-cujojs-when.js                   341       70.96
    promises-tildeio-rsvp.js                  370       69.68
    callbacks-caolan-async-waterfall.js       566      104.47
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 4.0.0
    V8 4.5.103.30
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
