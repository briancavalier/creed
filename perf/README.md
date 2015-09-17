Latest results, using latest versions of modules:

    ├── async@1.4.2
    ├── bluebird@2.10.0
    ├── co@4.6.0
    ├── rsvp@3.1.0
    └── when@3.7.3

bench doxbee-sequential

results for 10000 parallel executions, 1 ms per I/O op

    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               133       27.79
    callbacks-baseline.js                     162       32.43
    promises-bluebird-generator.js            200       33.89
    promises-cujojs-when-generator.js         226       40.27
    promises-creed-algebraic.js               232       52.67
    promises-creed.js                         232       52.87
    promises-bluebird.js                      275       44.88
    promises-tildeio-rsvp.js                  336       70.19
    promises-cujojs-when.js                   337       62.56
    callbacks-caolan-async-waterfall.js       572      104.56
    promises-ecmascript6-native.js            817      193.86
    generators-tj-co.js                       856      140.84
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 4.0.0
    V8 4.5.103.30
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench parallel (`--p 25`)

    results for 10000 parallel executions, 1 ms per I/O op

    file                                time(ms)  memory(MB)
    promises-creed.js                        334       98.36
    promises-bluebird.js                     342      111.16
    promises-creed-generator.js              400      114.34
    promises-bluebird-generator.js           408       90.07
    callbacks-baseline.js                    470       38.02
    promises-cujojs-when.js                  515      141.63
    promises-tildeio-rsvp.js                 558      189.67
    promises-cujojs-when-generator.js        589      139.90
    callbacks-caolan-async-parallel.js       831      179.28
    promises-ecmascript6-native.js          1794      509.96
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 4.0.0
    V8 4.5.103.30
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench doxbee-errors

    results for 10000 parallel executions, 1 ms per I/O op
    Likelihood of rejection: 0.1
    
    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               159       28.49
    callbacks-baseline.js                     172       32.45
    promises-bluebird-generator.js            229       33.10
    promises-creed.js                         250       53.14
    promises-creed-algebraic.js               264       53.64
    promises-bluebird.js                      318       43.54
    promises-cujojs-when.js                   363       67.52
    promises-tildeio-rsvp.js                  376       70.11
    callbacks-caolan-async-waterfall.js       544      104.33
    
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
