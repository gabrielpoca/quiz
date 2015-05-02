var Q = require('q');
var r = require('rethinkdb');
var R = require('ramda');

module.exports.setup = function(conn, config) {
  var deferred = Q.defer();

  var containsOrCreate = function(containsTable) {
    return r.branch(
      containsTable,
      { created: 0 },
      r.tableCreate('users')
    );
  };

  r.tableList().contains('users')
    .do(containsOrCreate)
    .run(conn, deferred.makeNodeResolver());

  return deferred.promise;
};

module.exports.all = function(conn) {
  var deferred = Q.defer();

  r.table('users').run(conn, function(err, cursor) {
    if (err)
      return deferred.reject(err);
    
    cursor.toArray(deferred.makeNodeResolver());
  });

  return deferred.promise;
};

module.exports.insert = function(conn, params) {
  params = R.pick(['username', 'password'], params);

  if (R.isNil(params.username))
    return Q.reject('username is required!');

  if (R.isNil(params.password))
    return Q.reject('password is required!');

  var deferred = Q.defer();
  var createFromParams = insert.bind(this, null, conn, params);

  findByParams(conn, { username: params.username })
    .then(function(users) {
      return users.next();
    })
    .then(function(user) {
      deferred.reject('username already registered');
    })
    .catch(createFromParams)
    .then(function(user) {
      deferred.resolve(user);
    })
    .catch(function(err) {
      deferred.reject(err);
    });

  return deferred.promise;
};

module.exports.findByParams = findByParams;

function findByParams(conn, params) {
  var deferred = Q.defer();

  var query = r.table('users').filter(params);
  query.run(conn, deferred.makeNodeResolver());

  return deferred.promise;
}

function insert(conn, params) {
  var deferred = Q.defer();
  var query = r.table('users').insert(params, { returnChanges: true });

  query.run(conn, function(err, result) {
    if (err)
      return deferred.reject(err);

    deferred.resolve(result.changes[0].new_val);
  });

  return deferred.promise;
}
