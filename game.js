var Q = require('q');
var R = require('ramda');

module.exports = function(DB) {
  var current;

  return {
    start: start
  };

  function start() {
    return DB.Questions.sample()
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
        return DB.Questions.sample()
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
    return DB.Answers.findByParams({ questionId: question.id });
  }
};
