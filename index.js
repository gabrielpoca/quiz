var R = require('ramda');

var app = require('./app');
var config = require(__dirname + '/config.js');

var Database = require('./database/database');
var Seed = require('./database/seed');

var UsersModel = require('./models/users');
var QuestionsModel = require('./models/questions');
var AnswersModel = require('./models/answers');
var Game = require('./game');

var initializeModel = R.curry(function(model, conn) {
  return model(conn).initialize();
});

var startExpress = function(conn) {
  app._rdbConn = conn;
  app.listen(config.express.port);
  console.log('Listening on port ' + config.express.port);
};

var startGame = function(conn) {
  return Game(conn)
    .then(function(game) {
      game.start();
    });
};

Database.initialize(config.rethinkdb)
  .tap(initializeModel(UsersModel))
  .tap(initializeModel(QuestionsModel))
  .tap(initializeModel(AnswersModel))
  .tap(Seed.run)
  .tap(startExpress)
  .tap(startGame)
  .catch(function(err) {
    console.error(err);
    throw err;
  });

process.on('uncaughtException', function(er) {
  console.error(er.stack);
  process.exit(1);
});
