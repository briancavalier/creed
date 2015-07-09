var truth = require('..');

process.addListener('unhandledRejection', function(){});

exports.resolved = truth.resolve;
exports.rejected = truth.reject;
exports.deferred = function() {
    var d = {
        resolve: void 0,
        reject: void 0,
        promise: void 0
    };

    d.promise = truth.promise(function(resolve, reject) {
        d.resolve = resolve;
        d.reject = reject;
    });

    return d;
};