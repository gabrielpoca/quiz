var Q = require('q');
var r = require('rethinkdb');
var R = require('ramda');

var utils = require('../utils');

module.exports = function(conn) {
  return {
    changes: changes,
    all: all,
    findByParams: findByParams,
    initialize: initialize,
    insert: validateInsert,
    sample: sample,
    incScore: incScore
  };

  function initialize() {
    return utils.containsOrCreateTable(conn, 'users');
  }

  function changes() {
    var query = r.table('users').changes()('new_val');
    return Q.ninvoke(query, 'run', conn);
  }

  function sample(num) {
    var defer = Q.defer();

    num = num || 1;
    var query = r.table('users').sample(num);
    query.run(conn, defer.makeNodeResolver());

    return defer.promise;
  }

  function all() {
    var deferred = Q.defer();

    r.table('users').run(conn, function(err, cursor) {
      if (err)
        return deferred.reject(err);

      cursor.toArray(deferred.makeNodeResolver());
    });

    return deferred.promise;
  }

  function incScore(userId) {
    var deferred = Q.defer();

    var query = r.table('users')
      .get(userId)
      .update({
        score: r.row('score').add(1).default(0)
      });

    query.run(conn, deferred.makeNodeResolver());

    return deferred.promise;
  }

  function validateInsert(params) {
    params = R.pick(['username', 'password'], params);

    if (R.isNil(params.username))
      return Q.reject('username is required!');

    if (R.isNil(params.password))
      return Q.reject('password is required!');

    var deferred = Q.defer();

    findByParams({ username: params.username })
      .then(function(users) {
        if (users.length !== 0)
          throw 'username already registered';
        else
          return insert(params);
      })
      .then(function(user) {
        deferred.resolve(user);
      })
      .catch(function(err) {
        console.log(err.stack);
        deferred.reject(err);
      });

    return deferred.promise;
  }

  function findByParams(params) {
    return Q.Promise(function(resolve) {
      var query = r.table('users').filter(params);
      query.run(conn, function(err, cursor) {
        if (err) throw err;

        cursor.toArray(function(err, users) {
          if (err) throw err;

          resolve(users);
        });
      });
    });
  }

  function insert(params) {
    return utils.saltAndHash(params.password)
      .then(function(hashedPassword) {
        params.password = hashedPassword;

        var query = r.table('users')
          .insert(params, { returnChanges: true });

        return Q.Promise(function(resolve) {
          query.run(conn, function(err, result) {
            if (err) throw(err);

            resolve(result.changes[0].new_val);
          });
        });
      });
  }
};
