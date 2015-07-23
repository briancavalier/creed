global.useBluebird = false;
global.useQ = false;
global.useWhen = false;

global.useCreed = true;
var creed = require('../../dist/creed');
require('../lib/fakesP');

module.exports = creed.co(function* upload(stream, idOrPath, tag, done) {
    var queries = new Array(global.parallelQueries);
    var tx = db.begin();

    for( var i = 0, len = queries.length; i < len; ++i ) {
        queries[i] = FileVersion.insert({index: i}).execWithin(tx);
    }

    try {
        yield creed.all(queries);
        tx.commit();
        done();
    }
    catch(e) {
        tx.rollback();
        done(e);
    }
});
