var lifter, fromNodeCallback;
if (global.useRx) {
    lifter = require("rx").Observable.fromNodeCallback;
} else if (global.useBacon) {
    fromNodeCallback = require("baconjs").fromNodeCallback;
} else if (global.useKefir) {
    fromNodeCallback = require("kefir").Kefir.fromNodeCallback;
    lifter = function(nodeFn) {
        return function() {
            var args = [].slice.call(arguments);            
            function thunk(callback) {
                args.push(callback);
                nodeFn.apply(null, args);
                args.pop();
            }
            return fromNodeCallback(thunk);
        }
    };
} else if (global.useHighland) {
    lifter = require("highland").wrapCallback;
} else if (global.useMost) {
  var most = require('most');
  var wn = require('when/node');
  lifter = function(nodeFn) {
    var lifted = wn.lift(nodeFn);
    return function() {
      return most.fromPromise(lifted.apply(this, arguments));
    };
  };
  // lifter = function(nodeFn) {
  //   return function() {
  //     var self = this;
  //     var l = arguments.length;
  //     var a = new Array(l);
  //     for(var i=0; i<l; ++i) {
  //       a[i] = arguments[i];
  //     }
  //
  //     return most.create(function(add, end, error) {
  //       nodeFn.apply(self, a.concat(handler));
  //
  //       function handler(err, x) {
  //         if(err != null) {
  //           return error(err);
  //         }
  //
  //         add(x);
  //         end();
  //       }
  //     });
  //   }
  // }
}

var slice = [].slice;

if (!lifter) {
    lifter = function(nodeFn) {
        return function() {
            var args = slice.call(arguments);
            args.unshift(nodeFn);
            return fromNodeCallback.apply(undefined, args);
        };
    };
}

var f = require('./dummy');

var makefakes = require('./fakemaker');

// A function taking n values or promises and returning
// a promise
function dummyP(n) {
    return lifter(f.dummy(n));
}

// Throwing version of above
function dummytP(n) {
    return lifter(f.dummyt(n));
}

makefakes(dummyP, dummytP, lifter);
