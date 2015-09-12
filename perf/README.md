Latest results, using latest versions of modules:

    ├── async@1.4.0
    ├── bluebird@2.9.34
    ├── co@4.6.0
    ├── rsvp@3.0.18
    └── when@3.7.3

bench doxbee-sequential
    
results for 10000 parallel executions, 1 ms per I/O op

    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               131       31.41
    callbacks-baseline.js                     156       32.50
    promises-bluebird-generator.js            177       34.35
    promises-cujojs-when-generator.js         190       43.65
    promises-creed.js                         216       52.97
    promises-bluebird.js                      243       45.98
    promises-cujojs-when.js                   323       63.62
    promises-tildeio-rsvp.js                  361       69.68
    callbacks-caolan-async-waterfall.js       587      102.45
    promises-ecmascript6-native.js            828      183.49
    generators-tj-co.js                      1029      146.84
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 3.2.0
    V8 4.4.63.26
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench parallel (`--p 25`)
    
    results for 10000 parallel executions, 1 ms per I/O op
    
    file                                time(ms)  memory(MB)
    promises-creed.js                        366      113.80
    promises-bluebird.js                     381      109.13
    promises-creed-generator.js              391      115.24
    promises-bluebird-generator.js           397      113.93
    callbacks-baseline.js                    452       38.00
    promises-tildeio-rsvp.js                 580      215.14
    promises-cujojs-when.js                  590      168.34
    promises-cujojs-when-generator.js        652      165.87
    callbacks-caolan-async-parallel.js       790      208.52
    promises-ecmascript6-native.js          1853      524.89
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 3.2.0
    V8 4.4.63.26
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8


bench doxbee-errors

results for 10000 parallel executions, 1 ms per I/O op
Likelihood of rejection: 0.1

    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               160       30.14
    callbacks-baseline.js                     175       32.59
    promises-bluebird-generator.js            204       32.75
    promises-creed-algebraic.js               254       52.98
    promises-creed.js                         257       52.99
    promises-bluebird.js                      327       54.43
    promises-cujojs-when.js                   341       68.60
    promises-tildeio-rsvp.js                  381       77.39
    callbacks-caolan-async-waterfall.js       603      102.64
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 3.2.0
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