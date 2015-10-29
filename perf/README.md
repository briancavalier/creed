Latest results, using latest versions of modules:

    ├── async@1.4.2
    ├── bluebird@2.10.0
    ├── co@4.6.0
    ├── rsvp@3.1.0
    └── when@3.7.3

bench doxbee-sequential

    results for 10000 parallel executions, 1 ms per I/O op
    
    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               131       28.02
    callbacks-baseline.js                     155       32.39
    promises-bluebird-generator.js            185       33.69
    promises-cujojs-when-generator.js         209       39.93
    promises-creed-algebraic.js               231       51.93
    promises-creed.js                         245       52.48
    promises-bluebird.js                      262       45.37
    promises-cujojs-when.js                   316       62.47
    promises-tildeio-rsvp.js                  335       69.05
    callbacks-caolan-async-waterfall.js       598      104.33
    promises-ecmascript6-native.js            821      195.04
    generators-tj-co.js                       843      144.11
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 4.2.1
    V8 4.5.103.35
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench parallel (`--p 25`)

    results for 10000 parallel executions, 1 ms per I/O op

    file                                time(ms)  memory(MB)
    promises-creed.js                        373       98.51
    promises-bluebird.js                     375      110.98
    promises-creed-generator.js              389      114.24
    promises-bluebird-generator.js           434       90.01
    callbacks-baseline.js                    485       37.88
    promises-cujojs-when-generator.js        562      140.10
    promises-tildeio-rsvp.js                 614      190.48
    promises-cujojs-when.js                  631      134.14
    callbacks-caolan-async-parallel.js       864      179.14
    promises-ecmascript6-native.js          1890      504.10
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 4.1.1
    V8 4.5.103.33
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench doxbee-errors

    results for 10000 parallel executions, 1 ms per I/O op
    Likelihood of rejection: 0.1
    
    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               166       26.27
    callbacks-baseline.js                     175       32.32
    promises-bluebird-generator.js            227       33.12
    promises-creed-algebraic.js               275       52.85
    promises-creed.js                         281       53.38
    promises-bluebird.js                      346       39.45
    promises-tildeio-rsvp.js                  359       70.05
    promises-cujojs-when.js                   373       70.49
    callbacks-caolan-async-waterfall.js       588      104.33
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 4.2.1
    V8 4.5.103.35
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
