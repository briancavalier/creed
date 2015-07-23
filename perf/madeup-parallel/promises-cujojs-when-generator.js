var when = require('when');
var g = require('when/generator');
require('../lib/fakesP');

module.exports = g.lift(function* upload(stream, idOrPath, tag, done) {
    var queries = new Array(global.parallelQueries);
    var tx = db.begin();

    for( var i = 0, len = queries.length; i < len; ++i ) {
        queries[i] = FileVersion.insert({index: i}).execWithin(tx);
    }

    try {
        yield when.all(queries);
        tx.commit();
        done();
    }
    catch(e) {
        tx.rollback();
        done(e);
    }
});
