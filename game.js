var Q = require('q');
var R = require('ramda');

module.exports = function(DB) {
  var current;

  return {
    start: start
  };

  function start() {
    return DB.Questions.sample()
      .then(nextQuestion)
      .then(setQuestion)
      .then(function() {
        setInterval(loop, 3000);
      });
  }

  function loop() {
    var question = currentQuestion();

    return answersForQuestion(question)
      .then(R.filter(R.eqProps('answerId', question)))
      .then(R.map(R.path(['userId'])))
      .then(R.map(DB.Users.incScore))
      .then(function(winnerAnswers) {
        return DB.Questions.sample()
          .then(nextQuestion)
          .then(setQuestion);
    });
  }

  function setQuestion(question) {
    current = question;
  }

  function currentQuestion() {
    return current;
  }

  function answersForQuestion(question) {
    return DB.Answers.findByParams({ questionId: question.id });
  }

  function nextQuestion() {
    return Q.Promise(function(resolve) {
      DB.Questions.sample()
        .then(function(cursor) {
          cursor.next().then(resolve);
        });
    });
  }
};
