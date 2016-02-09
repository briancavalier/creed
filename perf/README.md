Latest results, using latest versions of modules:

    ├── async@1.4.2
    ├── bluebird@2.10.0
    ├── co@4.6.0
    ├── rsvp@3.1.0
    └── when@3.7.3

bench doxbee-sequential

results for 10000 parallel executions, 1 ms per I/O op

    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               202       34.96
    callbacks-baseline.js                     204       36.57
    promises-bluebird-generator.js            272       37.95
    promises-cujojs-when-generator.js         272       43.30
    promises-creed.js                         311       52.67
    promises-creed-algebraic.js               314       52.43
    promises-bluebird.js                      368       50.87
    promises-cujojs-when.js                   379       69.66
    promises-tildeio-rsvp.js                  507      101.64
    callbacks-caolan-async-waterfall.js       630      112.25
    promises-ecmascript6-native.js            874      185.33
    generators-tj-co.js                       886      152.50
    
    Platform info:
    Darwin 15.3.0 x64
    Node.JS 5.5.0
    V8 4.6.85.31
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench parallel (`--p 25`)

    results for 10000 parallel executions, 1 ms per I/O op

    file                                time(ms)  memory(MB)
    callbacks-baseline.js                    368       46.46
    promises-bluebird.js                     471       98.08
    promises-creed.js                        475      112.07
    promises-bluebird-generator.js           503      103.70
    promises-creed-generator.js              531      121.96
    promises-cujojs-when.js                  880      162.11
    promises-cujojs-when-generator.js        885      165.66
    callbacks-caolan-async-parallel.js       989      165.22
    promises-tildeio-rsvp.js                1504      389.75
    promises-ecmascript6-native.js          2027      524.55
    
    Platform info:
    Darwin 15.3.0 x64
    Node.JS 5.5.0
    V8 4.6.85.31
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench doxbee-errors

    results for 10000 parallel executions, 1 ms per I/O op
    Likelihood of rejection: 0.1
    
    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               229       33.80
    callbacks-baseline.js                     239       34.31
    promises-bluebird-generator.js            284       37.89
    promises-creed-algebraic.js               354       54.44
    promises-creed.js                         355       54.33
    promises-bluebird.js                      430       56.15
    promises-tildeio-rsvp.js                  488      100.13
    promises-cujojs-when.js                   492       74.08
    callbacks-caolan-async-waterfall.js       634      112.24
    
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
