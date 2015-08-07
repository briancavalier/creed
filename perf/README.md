Latest results, using latest versions of modules:

    ├── async@1.4.0
    ├── bluebird@2.9.34
    ├── co@4.6.0
    ├── rsvp@3.0.18
    └── when@3.7.3

bench doxbee-sequential

results for 10000 parallel executions, 1 ms per I/O op

    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               147       32.07
    callbacks-baseline.js                     157       32.45
    promises-bluebird-generator.js            206       34.35
    promises-cujojs-when-generator.js         207       43.96
    promises-creed.js                         213       52.52
    promises-bluebird.js                      275       46.13
    promises-cujojs-when.js                   357       67.27
    promises-tildeio-rsvp.js                  366       70.92
    callbacks-caolan-async-waterfall.js       554      102.50
    promises-ecmascript6-native.js            805      182.83
    generators-tj-co.js                      1143      157.06
    
    Platform info:
    Darwin 14.4.0 x64
    Node.JS 3.0.0
    V8 4.4.63.26
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench parallel (`--p 25`)
    
    results for 10000 parallel executions, 1 ms per I/O op
    
    file                                time(ms)  memory(MB)
    promises-creed.js                        331      114.59
    promises-bluebird.js                     363      109.03
    promises-creed-generator.js              399      115.49
    promises-bluebird-generator.js           400      113.89
    callbacks-baseline.js                    475       37.96
    promises-cujojs-when.js                  564      165.75
    promises-tildeio-rsvp.js                 577      215.54
    promises-cujojs-when-generator.js        681      163.87
    callbacks-caolan-async-parallel.js       799      209.07
    promises-ecmascript6-native.js          1894      510.07
    
    Platform info:
    Darwin 14.4.0 x64
    Node.JS 3.0.0
    V8 4.4.63.26
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench doxbee-errors

    results for 10000 parallel executions, 1 ms per I/O op
    Likelihood of rejection: 0.1
    
    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               167       29.84
    callbacks-baseline.js                     175       32.24
    promises-bluebird-generator.js            216       32.65
    promises-creed.js                         248       52.44
    promises-bluebird.js                      308       55.40
    promises-cujojs-when.js                   362       69.01
    promises-tildeio-rsvp.js                  404       74.13
    callbacks-caolan-async-waterfall.js       581      102.48
    
    Platform info:
    Darwin 14.4.0 x64
    Node.JS 3.0.0
    V8 4.4.63.26
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