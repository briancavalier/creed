Latest results, using latest versions of modules:

    ├── async@1.4.0
    ├── bluebird@2.9.34
    ├── co@4.6.0
    ├── rsvp@3.0.18
    └── when@3.7.3

bench doxbee-sequential
    
    results for 10000 parallel executions, 1 ms per I/O op
    
    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               127       31.57
    callbacks-baseline.js                     159       32.45
    promises-bluebird-generator.js            187       34.33
    promises-creed.js                         207       52.71
    promises-cujojs-when-generator.js         219       44.17
    promises-bluebird.js                      238       45.39
    promises-cujojs-when.js                   329       67.75
    promises-tildeio-rsvp.js                  369       70.95
    callbacks-caolan-async-waterfall.js       571      102.54
    promises-ecmascript6-native.js            754      183.83
    generators-tj-co.js                      1093      156.84
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 3.1.0
    V8 4.4.63.26
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench parallel (`--p 25`)
    
results for 10000 parallel executions, 1 ms per I/O op

    file                                time(ms)  memory(MB)
    promises-creed.js                        344      113.50
    promises-bluebird.js                     361      109.25
    promises-bluebird-generator.js           368      114.15
    promises-creed-generator.js              371      115.11
    callbacks-baseline.js                    458       37.98
    promises-tildeio-rsvp.js                 536      215.46
    promises-cujojs-when.js                  548      167.74
    promises-cujojs-when-generator.js        582      165.79
    callbacks-caolan-async-parallel.js       738      208.47
    promises-ecmascript6-native.js          1716      525.43
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 3.1.0
    V8 4.4.63.26
    Intel(R) Core(TM) i7-4870HQ CPU @ 2.50GHz × 8

bench doxbee-errors

    results for 10000 parallel executions, 1 ms per I/O op
    Likelihood of rejection: 0.1
    
    file                                 time(ms)  memory(MB)
    promises-creed-generator.js               153       29.86
    callbacks-baseline.js                     160       32.38
    promises-bluebird-generator.js            211       33.54
    promises-creed.js                         240       52.90
    promises-bluebird.js                      312       55.35
    promises-cujojs-when.js                   341       68.70
    promises-tildeio-rsvp.js                  365       70.51
    callbacks-caolan-async-waterfall.js       567      102.63
    
    Platform info:
    Darwin 14.5.0 x64
    Node.JS 3.1.0
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