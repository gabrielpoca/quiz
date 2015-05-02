var Q = require('q');
var r = require('rethinkdb');
var R = require('ramda');
var Database = require('../database/database');

module.exports.setup = function(conn) {
  return Database.containsOrCreateTable(conn, 'answers');
};

module.exports.insert = function(conn, params) {
  params = R.pick(['answerId', 'questionId', 'userId'], params);

  return insert(conn, params);
};

module.exports.update = function(conn, id, params) {
  return Q.Promise(function(resolve) {
    var query = r.table('answers').get(id)
      .update(params, { returnChanges: true });
    query.run(conn, function(err, res) {
      if (err) throw err;

      console.log(res);

      resolve(params);
    });
  });
};

module.exports.findByParams = findByParams;

function findByParams(conn, params) {
  return Q.Promise(function(resolve) {
    var query = r.table('answers').filter(params);
    query.run(conn, function(err, cursor) {
      if (err) throw err;

      cursor.toArray(function(err, users) {
        if (err) throw err;

        resolve(users);
      });
    });
  });
}

function insert(conn, params) {
  return Q.Promise(function(resolve) {
    var query = r.table('answers').insert(params, { returnChanges: true });

    query.run(conn, function(err, result) {
      if (err)
        throw err;

      resolve(result.changes[0].new_val);
    });
  });
}
