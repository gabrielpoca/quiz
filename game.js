var Q = require('q');
var R = require('ramda');

var AnswersModel = require('./models/answers');
var QuestionsModel = require('./models/questions');
var UsersModel = require('./models/users');

var current;

module.exports = function(conn) {
  var Answers = AnswersModel(conn);
  var Questions = QuestionsModel(conn);
  var Users = UsersModel(conn);

  return Q.all([
    Answers.initialize(),
    Questions.initialize(),
    Users.initialize(),
  ]).thenj(function() {
    return {
      start: start
    };
  });

  function start() {
    return Questions.sample()
      .then(function(cursor) {
        return cursor.next()
          .then(setQuestion);
      })
      .then(function() {
        setInterval(loop, 3000);
      });
  }

  function loop() {
    var question = currentQuestion();

    return answersForQuestion(question)
      .tap(console.log)
      .then(R.filter(R.eqProps('answerId', question.answerId)))
      .then(function(winnerAnswers) {
        console.log(R.pick(['userId'], winnerAnswers));
        return Questions.sample()
          .then(function(cursor) {
            return cursor.next()
              .then(setQuestion);
          });
    });
  }

  function setQuestion(question) {
    current = question;
    console.log('current question', question);
  }

  function currentQuestion() {
    return current;
  }

  function answersForQuestion(question) {
    return AnswersModel(conn)
      .findByParams({ questionId: question.id });
  }
};
