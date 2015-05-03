var Q = require('q');
var r = require('rethinkdb');
var R = require('ramda');

var utils = require('../utils');

module.exports = function(conn) {
  return {
    all: all,
    findByParams: findByParams,
    initialize: initialize,
    insert: validateInsert,
    sample: sample,
  };

  function initialize() {
    return utils.containsOrCreateTable(conn, 'users');
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
    var deferred = Q.defer();
    var query = r.table('users').insert(params, { returnChanges: true });
    console.log('you');

    query.run(conn, function(err, result) {
      if (err)
        return deferred.reject(err);

      deferred.resolve(result.changes[0].new_val);
    });

    return deferred.promise;
  }
};
