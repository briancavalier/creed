global.useCreed = true;
global.useQ = false;
global.useBluebird = false;

var creed = require('../..');

require('../lib/fakesP');

module.exports = function upload(stream, idOrPath, tag, done) {
    var blob = blobManager.create(account);
    var tx = db.begin();
    var blobIdP = blob.put(stream);
    var fileP = self.byUuidOrPath(idOrPath).get();
    var version, fileId, file;

    creed.merge(function(blobId, fileV) {
        file = fileV;
        var previousId = file ? file.version : null;
        version = {
            userAccountId: userAccount.id,
            date: new Date(),
            blobId: blobId,
            creatorId: userAccount.id,
            previousId: previousId,
        };
        version.id = Version.createHash(version);
        return Version.insert(version).execWithin(tx);
    }, blobIdP, fileP).chain(function() {
        triggerIntentionalError();
        if (!file) {
            var splitPath = idOrPath.split('/');
            var fileName = splitPath[splitPath.length - 1];
            var newId = uuid.v1();
            return self.createQuery(idOrPath, {
                id: newId,
                userAccountId: userAccount.id,
                name: fileName,
                version: version.id
            }).chain(function(q) {
                return q.execWithin(tx);
            }).map(function() {
                return newId;
            });
        } else {
            return creed.fulfill(file.id);
        }
    }).chain(function(fileIdV) {
        triggerIntentionalError();
        fileId = fileIdV;
        return FileVersion.insert({
            fileId: fileId,
            versionId: version.id
        }).execWithin(tx);
    }).chain(function() {
        triggerIntentionalError();
        return File.whereUpdate({id: fileId}, {version: version.id})
            .execWithin(tx);
    }).map(function() {
        triggerIntentionalError();
        tx.commit();
        return done();
    }).then(null, function(err) {
        tx.rollback();
        return done(err);
    });
}
