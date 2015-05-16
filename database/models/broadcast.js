var Q = require('q');
var r = require('rethinkdb');
var R = require('ramda');

var utils = require('../utils');

var TABLE = 'broadcast';

module.exports = function(conn) {
  return {
    initialize: initialize,
    publish: publish,
    subscribe: subscribe
  };

  function initialize() {
    return utils.containsOrCreateTable(conn, TABLE);
  }

  function publish(topic, args) {
    var obj = { topic: topic, args: args };

    var query = r.table(TABLE).insert(obj);

    return Q.ninvoke(query, "run", conn);
  }

  function subscribe(callback) {
    var query = r.table(TABLE)
      .changes()('new_val');

    return Q.ninvoke(query, "run", conn)
      .then(callback);
  }
};
