Latest results, using latest versions of modules:

    ├── async@1.4.0
    ├── bluebird@2.9.34
    ├── co@4.6.0
    ├── rsvp@3.0.18
    └── when@3.7.3

bench doxbee-sequential

    results for 10000 parallel executions, 1 ms per I/O op

    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               145       36.64
    callbacks-baseline.js                     154       33.43
    promises-bluebird-generator.js            189       28.80
    promises-cujojs-when-generator.js         210       40.20
    promises-creed.js                         251       53.47
    promises-bluebird.js                      268       51.14
    promises-cujojs-when.js                   318       66.03
    promises-tildeio-rsvp.js                  352       72.87
    callbacks-caolan-async-waterfall.js       620      103.42
    promises-ecmascript6-native.js            738      186.46
    generators-tj-co.js                       819      150.20
    
    Platform info:
    Darwin 14.4.0 x64
    Node.JS 2.3.4
    V8 4.2.77.20
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench parallel (`--p 25`)

    results for 10000 parallel executions, 1 ms per I/O op

    file                                time(ms)  memory(MB)
    callbacks-baseline.js                    153       38.04
    promises-creed.js                        342      108.00
    promises-bluebird.js                     351      110.36
    promises-bluebird-generator.js           381      110.88
    promises-creed-generator.js              387      113.81
    promises-tildeio-rsvp.js                 575      216.45
    promises-cujojs-when.js                  583      168.26
    promises-cujojs-when-generator.js        584      163.57
    callbacks-caolan-async-parallel.js       766      211.05
    promises-ecmascript6-native.js          1954      533.15
    
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