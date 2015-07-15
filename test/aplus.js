var creed = require('..');

process.addListener('unhandledRejection', function(){});

exports.resolved = creed.resolve;
exports.rejected = creed.reject;
exports.deferred = function() {
    return {
        resolve: function(x) { this.promise._resolve(x); },
        reject: function(e) { this.promise._reject(e); },
        promise: new creed.Promise
    };
};