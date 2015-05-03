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
  return QuestionsModel(conn).sample()
    .then(function(cursor) {
      return cursor.next()
        .then(Game.nextQuestion);
    })
    .then(function() {
      setInterval(gameLoop, 30000, conn);
      return gameLoop(conn);
    });
};

Database.initialize(config.rethinkdb)
  .tap(initializeModel(UsersModel))
  .tap(initializeModel(QuestionsModel))
  .tap(initializeModel(AnswersModel))
  .tap(Seed.run)
  .tap(startExpress)
  .then(startGame)
  .catch(function(err) {
    console.error(err);
    throw err;
  });

process.on('uncaughtException', function(er) {
  console.error(er.stack);
  process.exit(1);
});

function gameLoop(conn) {
  var question = Game.currentQuestion();

    answersForQuestion(conn, question)
      .tap(console.log)
      .then(R.filter(R.eqProps('answerId', question.answerId)))
      .then(function(winnerAnswers) {
        console.log(winnerAnswers);
        return QuestionsModel(conn).sample()
          .then(function(cursor) {
            return cursor.next()
              .then(Game.nextQuestion);
          });
    });
}

function answersForQuestion(conn, question) {
  return AnswersModel(conn)
    .findByParams({ questionId: question.id });
}
