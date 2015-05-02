var Q = require('q');
var R = require('ramda');
var QuestionsModel = require('./models/questions');
var AnswersModel = require('./models/answers');

var current;

module.exports.setup = function(conn) {
  QuestionsModel(conn).all()
    .then(function(questions) {
      current = questions[0];
    });
};

module.exports.saveAnswer = function(conn, userId, questionId, answerId) {
  if (!current)
    return Q.reject('No question available');

  if (current.id !== questionId)
    return Q.reject('anwer doesn\'t match question in game');

  var params = {
    userId: userId,
    answerId: answerId,
    questionId: questionId
  };

  return AnswersModel(conn).findByParams(R.omit(['answerId'], params))
    .then(function(answers) {
      if (answers.length === 0) {
        return AnswersModel(conn).insert(params);
      } else {
        return AnswersModel(conn).update(answers[0].id, params);
      }
    });
};
