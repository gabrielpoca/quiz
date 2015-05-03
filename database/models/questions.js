var Q = require('q');
var r = require('rethinkdb');
var R = require('ramda');

var utils = require('../utils');

module.exports = function(conn) {
  return {
    all: all,
    initialize: initialize,
    insert: insert,
    sample: sample,
  };

  function initialize() {
    return utils.containsOrCreateTable(conn, 'questions');
  }

  function sample(num) {
    var defer = Q.defer();

    num = num || 1;
    var query = r.table('questions').sample(num)
    query.run(conn, defer.makeNodeResolver());

    return defer.promise;
  }

  function all() {
    return Q.Promise(function(resolve) {
      r.table('questions').run(conn, function(err, cursor) {
        if (err) throw err;

        cursor.toArray(function(err, questions) {
          if (err) throw err;

          resolve(questions);
        });
      });
    });
  }

  function insert(params) {
    params = R.pick(['body', 'answerId', 'answers'], params);

    return Q.Promise(function(resolve) {
      var query = r.table('questions').insert(params, { returnChanges: true });

      query.run(conn, function(err, result) {
        if (err)
          throw err;

        resolve(result.changes[0].new_val);
      });
    });
  }
};
