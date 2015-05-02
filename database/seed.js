var R = require('ramda');
var Questions = require('../models/questions');

module.exports.run = function(conn) {
  var questionsList = [
    {
      body: 'Whoami?',
      anserId: 1,
      answers: [
        {
          id: 1,
          body: 'Gabriel'
        },
        {
          id: 2,
          body: 'Miguel'
        }
      ]
    }
  ];


  Questions.all(conn)
    .then(function(res) {
      if (! R.isEmpty(res)) return;
      console.log(res);

      R.forEach(R.curry(Questions.insert)(conn), questionsList);
    });
};
