var Q = require('q');
var R = require('ramda');

module.exports = function(App, DB) {
  var current;

  DB.Users.changes()
    .then(function(cursor) {
      cursor.each(function(err, user) {
        if (err) return;

        DB.Broadcast.publish('users:update', user);
      });
    });

  return {
    start: start
  };

  function start() {
    return DB.Questions.sample()
      .then(nextQuestion)
      .then(setQuestion)
      .then(function() {
        setInterval(loop, 15000);
      });
  }

  function loop() {
    var question = currentQuestion();

    return answersForQuestion(question)
      .then(R.filter(R.eqProps('answerId', question)))
      .then(R.map(R.path(['userId'])))
      .tap(R.map(DB.Users.incScore))
      .then(function(winnerAnswers) {
        DB.Broadcast.publish('game:winners', winnerAnswers);
        return DB.Questions.sample()
          .then(nextQuestion)
          .then(setQuestion)
          .then(DB.Answers.deleteAll);
    });
  }

  function setQuestion(question) {
    current = question;
    DB.Broadcast.publish('game:question', question);
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
