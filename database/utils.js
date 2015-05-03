var Q = require('q');
var r = require('rethinkdb');

module.exports.containsOrCreateTable = function(conn, tableName) {
  var deferred = Q.defer();

  var containsOrCreate = function(containsTable) {
    return r.branch(
      containsTable,
      { created: 0 },
      r.tableCreate(tableName)
    );
  };

  r.tableList().contains(tableName)
    .do(containsOrCreate)
    .run(conn, deferred.makeNodeResolver());

  return deferred.promise;
};


module.exports.containsOrCreateDatabase = function(config) {
  var containsOrCreate = function(containsDB) {
    return r.branch(
      containsDB,
      { created: 0 },
      r.dbCreate(config.db)
    );
  };

  return Q.Promise(function(resolve) {
    r.connect(config, function(err, conn) {
      if (err) throw err;

      r.dbList().contains(config.db)
        .do(containsOrCreate)
        .run(conn, function(err) {
          if (err) throw err;

          resolve(conn);
        });
    });
  });
};
