var R = require('ramda');
var QuestionsModel = require('../models/questions');

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
        },
        {
          id: 3,
          body: 'Bruno'
        },
        {
          id: 4,
          body: 'Roberto'
        }
      ]
    },
    {
      body: 'Qual a capital de Portugal?',
      anserId: 3,
      answers: [
        {
          id: 1,
          body: 'Braga'
        },
        {
          id: 2,
          body: 'Porto'
        },
        {
          id: 3,
          body: 'Póvoa de Lanhoso'
        },
        {
          id: 4,
          body: 'Lisboa'
        }
      ]
    },
    {
      body: 'Qual a cor das mangas do colete branco de Napoleão?',
      anserId: 3,
      answers: [
        {
          id: 1,
          body: 'Vermelho'
        },
        {
          id: 2,
          body: 'Branco'
        },
        {
          id: 3,
          body: 'Não tem mangas'
        },
        {
          id: 4,
          body: 'Lilás'
        }
      ]
    }
  ];


  QuestionsModel(conn).all()
    .then(function(res) {
      if (! R.isEmpty(res)) return;

      R.forEach(QuestionsModel(conn).insert, questionsList);
    });
};
