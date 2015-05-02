var Q = require('q');
var r = require('rethinkdb');

module.exports.setup = function(config) {
  var deferred = Q.defer();

  r.connect(config, function(err, conn) {
    if (err)
      return deferred.reject(new Error(err));

    r.dbList().contains(config.db)
      .do(function(containsDB) {
        return r.branch(
          containsDB,
          { created: 0 },
          r.dbCreate(config.db)
        );
      })
      .run(conn, function(err) {
        if (err)
          return deferred.reject(new Error(err));

        deferred.resolve(conn);
      });
  });

  return deferred.promise;
};
