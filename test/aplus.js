var lib = require('..');

process.addListener('unhandledRejection', function(){});

exports.resolved = lib.resolve;
exports.rejected = lib.reject;
exports.deferred = function() {
    return {
        resolve: function(x) { this.promise._resolve(x); },
        reject: function(e) { this.promise._reject(e); },
        promise: new lib.Promise()
    };
};