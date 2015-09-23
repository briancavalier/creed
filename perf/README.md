Latest results, using latest versions of modules:

    ├── async@1.4.2
    ├── bluebird@2.10.0
    ├── co@4.6.0
    ├── rsvp@3.1.0
    └── when@3.7.3

bench doxbee-sequential

    results for 10000 parallel executions, 1 ms per I/O op
    
    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               132       27.94
    callbacks-baseline.js                     152       32.40
    promises-bluebird-generator.js            192       34.55
    promises-cujojs-when-generator.js         218       40.15
    promises-creed.js                         224       52.80
    promises-creed-algebraic.js               235       52.31
    promises-bluebird.js                      269       44.65
    promises-tildeio-rsvp.js                  324       75.59
    promises-cujojs-when.js                   338       62.46
    callbacks-caolan-async-waterfall.js       553      104.39
    promises-ecmascript6-native.js            823      192.99
    generators-tj-co.js                       834      140.39
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 4.1.0
    V8 4.5.103.33
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench parallel (`--p 25`)

    results for 10000 parallel executions, 1 ms per I/O op
    
    file                                time(ms)  memory(MB)
    promises-creed.js                        350       98.18
    promises-bluebird.js                     358      110.73
    promises-creed-generator.js              371      115.40
    promises-bluebird-generator.js           412       89.96
    callbacks-baseline.js                    470       38.05
    promises-tildeio-rsvp.js                 514      190.29
    promises-cujojs-when.js                  623      135.40
    promises-cujojs-when-generator.js        645      134.38
    callbacks-caolan-async-parallel.js       842      179.11
    promises-ecmascript6-native.js          1883      510.98
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 4.1.0
    V8 4.5.103.33
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench doxbee-errors

    results for 10000 parallel executions, 1 ms per I/O op
    Likelihood of rejection: 0.1
    
    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               161       26.65
    callbacks-baseline.js                     172       32.26
    promises-bluebird-generator.js            229       33.17
    promises-creed.js                         254       53.02
    promises-creed-algebraic.js               259       53.24
    promises-tildeio-rsvp.js                  336       70.01
    promises-bluebird.js                      338       54.30
    promises-cujojs-when.js                   371       68.63
    callbacks-caolan-async-waterfall.js       557      104.38
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 4.1.0
    V8 4.5.103.33
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
