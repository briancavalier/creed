Latest results, using latest versions of modules:

    ├── async@1.4.0
    ├── bluebird@2.9.34
    ├── co@4.6.0
    ├── rsvp@3.0.18
    └── when@3.7.3

bench doxbee-sequential
    
    results for 10000 parallel executions, 1 ms per I/O op
    
    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               129       27.96
    callbacks-baseline.js                     152       32.52
    promises-bluebird-generator.js            202       34.75
    promises-cujojs-when-generator.js         206       40.38
    promises-creed-algebraic.js               237       52.15
    promises-creed.js                         241       52.68
    promises-bluebird.js                      270       45.36
    promises-cujojs-when.js                   325       66.90
    promises-tildeio-rsvp.js                  359       70.18
    callbacks-caolan-async-waterfall.js       553      104.34
    promises-ecmascript6-native.js            803      193.80
    generators-tj-co.js                       825      143.87
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 4.0.0
    V8 4.5.103.30
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench parallel (`--p 25`)
    
    results for 10000 parallel executions, 1 ms per I/O op
    
    file                                time(ms)  memory(MB)
    promises-creed.js                        355      112.68
    promises-bluebird.js                     386      108.23
    promises-creed-generator.js              393      114.04
    promises-bluebird-generator.js           414       88.48
    callbacks-baseline.js                    471       38.01
    promises-tildeio-rsvp.js                 549      189.87
    promises-cujojs-when.js                  625      134.36
    promises-cujojs-when-generator.js        691      135.51
    callbacks-caolan-async-parallel.js       883      179.19
    promises-ecmascript6-native.js          1836      507.21
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 4.0.0
    V8 4.5.103.30
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench doxbee-errors

    results for 10000 parallel executions, 1 ms per I/O op
    Likelihood of rejection: 0.1
    
    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               167       26.98
    callbacks-baseline.js                     171       32.63
    promises-bluebird-generator.js            230       33.30
    promises-creed.js                         262       53.00
    promises-creed-algebraic.js               269       52.75
    promises-bluebird.js                      324       53.98
    promises-cujojs-when.js                   376       68.07
    promises-tildeio-rsvp.js                  390       69.74
    callbacks-caolan-async-waterfall.js       573      104.56
    
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
