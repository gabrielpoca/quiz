var Q = require('q');
var r = require('rethinkdb');
var crypto = require('crypto');

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

var generateSalt = function() {
  var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
  var salt = '';

  for (var i = 0; i < 10; i++) {
    var p = Math.floor(Math.random() * set.length);
    salt += set[p];
  }

  return salt;
}

var md5 = function(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

module.exports.saltAndHash = function(password) {
  var salt = generateSalt();
  return Q(salt + md5(password + salt));
};

module.exports.eqPasswords = function(plainPassword, hashedPassword) {
  var salt = hashedPassword.substr(0, 10);
  var validHash = salt + md5(plainPassword + salt);
  if (hashedPassword === validHash)
    return Q();
  else
    return Q.reject('passwords don\'t match');
};
