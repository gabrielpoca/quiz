var Q = require('q');

var config = require('../config');
var utils = require('./utils');
var seed = require('./seed');

var AnswersModel = require('./models/answers');
var QuestionsModel = require('./models/questions');
var UsersModel = require('./models/users');
var BroadcastModel = require('./models/broadcast');

config.rethinkdb.host = process.env.RETHINKDB_URL || config.rethinkdb.host;

module.exports = utils.containsOrCreateDatabase(config.rethinkdb)
  .then(function(conn) {
    var Answers = AnswersModel(conn);
    var Questions = QuestionsModel(conn);
    var Users = UsersModel(conn);
    var Broadcast = BroadcastModel(conn);

    return Q.all([
      Answers.initialize(),
      Questions.initialize(),
      Users.initialize(),
      Broadcast.initialize()
    ]).then(function() {
      return seed.run(Questions);
    }).then(function() {
      return {
        Answers: Answers,
        Questions: Questions,
        Users: Users,
        Broadcast: Broadcast,
        Utils: utils
      };
    });
  });
