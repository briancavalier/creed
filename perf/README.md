Latest results, using latest versions of modules:

    ├── async@1.4.2
    ├── bluebird@2.10.0
    ├── co@4.6.0
    ├── rsvp@3.1.0
    └── when@3.7.3

bench doxbee-sequential

    results for 10000 parallel executions, 1 ms per I/O op
    
    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               201       34.43
    callbacks-baseline.js                     212       36.56
    promises-bluebird-generator.js            262       38.03
    promises-cujojs-when-generator.js         275       43.44
    promises-creed-algebraic.js               298       51.87
    promises-creed.js                         311       52.93
    promises-bluebird.js                      348       50.57
    promises-cujojs-when.js                   418       66.00
    promises-tildeio-rsvp.js                  437      102.28
    callbacks-caolan-async-waterfall.js       615      112.40
    promises-ecmascript6-native.js            835      186.54
    generators-tj-co.js                       926      152.67
    
    Platform info:
    Darwin 15.3.0 x64
    Node.JS 5.5.0
    V8 4.6.85.31
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench parallel (`--p 25`)

    results for 10000 parallel executions, 1 ms per I/O op
    
    file                                time(ms)  memory(MB)
    callbacks-baseline.js                    414       46.30
    promises-bluebird.js                     479       97.98
    promises-creed.js                        491      111.80
    promises-creed-generator.js              540      121.84
    promises-bluebird-generator.js           544      103.63
    promises-cujojs-when.js                  800      161.13
    promises-cujojs-when-generator.js        926      166.24
    callbacks-caolan-async-parallel.js       962      165.18
    promises-tildeio-rsvp.js                1463      389.81
    promises-ecmascript6-native.js          2112      524.65
    
    Platform info:
    Darwin 15.3.0 x64
    Node.JS 5.5.0
    V8 4.6.85.31
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench doxbee-errors

    results for 10000 parallel executions, 1 ms per I/O op
    Likelihood of rejection: 0.1
    
    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               216       33.45
    callbacks-baseline.js                     228       34.20
    promises-bluebird-generator.js            285       37.82
    promises-creed-algebraic.js               343       53.56
    promises-creed.js                         353       54.84
    promises-bluebird.js                      400       54.66
    promises-cujojs-when.js                   427       73.43
    promises-tildeio-rsvp.js                  484       99.70
    callbacks-caolan-async-waterfall.js       639      112.30
    
    Platform info:
    Darwin 15.3.0 x64
    Node.JS 5.5.0
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
