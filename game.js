var Q = require('q');
var R = require('ramda');
var Questions = require('./models/questions');
var Answers = require('./models/answers');

var current;

module.exports.setup = function(conn) {
  Questions.all(conn)
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

  return Answers.findByParams(conn, R.omit(['answerId'], params))
    .then(function(answers) {
      if (answers.length === 0) {
        return Answers.insert(conn, params);
      } else {
        return Answers.update(conn, answers[0].id, params);
      }
    });
};
