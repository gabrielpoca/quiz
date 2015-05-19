var Q = require('q');
var R = require('ramda');

module.exports = function(DB) {
  var currentQuestion;

  return {
    start: start
  };

  function start() {
    return retrieveQuestion()
      .then(setQuestion)
      .then(function() {
        setInterval(loop, 15000);
      });
  }

  function loop() {
    return answersForQuestion(currentQuestion)
      .then(R.filter(R.eqProps('answerId', currentQuestion)))
      .then(R.map(R.path(['userId'])))
      .tap(R.map(DB.Users.incScore))
      .then(function(winnerAnswers) {
        DB.Broadcast.publish('game:winners', winnerAnswers);
        return DB.Questions.sample()
          .then(retrieveQuestion)
          .then(setQuestion)
          .then(DB.Answers.deleteAll);
    });
  }

  function setQuestion(question) {
    currentQuestion = question;
    DB.Broadcast.publish('game:question', question);
  }

  function answersForQuestion(question) {
    return DB.Answers.findByParams({ questionId: question.id });
  }

  function retrieveQuestion() {
    return Q.Promise(function(resolve) {
      DB.Questions.sample()
        .then(function(cursor) {
          cursor.next().then(resolve);
        });
    });
  }
};
