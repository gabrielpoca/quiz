var r = require('rethinkdb');
var R = require('ramda');

var app = require('./app');
var config = require(__dirname + '/config.js');

var Database = require('./database/database');
var Seed = require('./database/seed');

var UsersModel = require('./models/users');
var QuestionsModel = require('./models/questions');
var AnswersModel = require('./models/answers');
var Game = require('./game');

Database.setup(config.rethinkdb)
  .tap(function(conn) {
    return UsersModel(conn).setup();
  })
  .tap(function(conn) {
    return QuestionsModel(conn).setup();
  })
  .tap(function(conn) {
    return AnswersModel(conn).setup();
  })
  .tap(Seed.run)
  .tap(Game.setup)
  .then(startExpress)
  .catch(function(err) {
    console.error(err);
    throw err;
  });

function startExpress(connection) {
  app._rdbConn = connection;
  app.listen(config.express.port);
  console.log('Listening on port ' + config.express.port);
}

process.on('uncaughtException', function (er) {
  console.error(er.stack);
  process.exit(1);
});
