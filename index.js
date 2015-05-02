var bodyParser = require('body-parser');
var express = require('express');
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var r = require('rethinkdb');
var R = require('ramda');

var app = express();
var config = require(__dirname + '/config.js');

var Database = require('./database/database');
var Seed = require('./database/seed');

var Users = require('./models/users');
var Questions = require('./models/questions');
var Answers = require('./models/answers');

var Game = require('./game');

passport.use(new BasicStrategy({}, function(username, password, done) {
  var params = { username: username };

  Users.findByParams(app._rdbConn, params)
    .then(function(users) {
      if (users.length !== 0)
        done(null, users[0]);
      else
        throw 'not authorized';
    })
    .catch(function(err) {
      done({ message: 'you are not authorized' });
    });
}));

app.use(passport.initialize());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/register', function(req, res) {
  Users.insert(req.app._rdbConn, req.body)
    .then(function(user) {
      res.json(user);
    })
    .catch(function(err) {
      res.status(500).json({ error: err });
    });
});

app.get('/me', passport.authenticate('basic', { session: false }),
  function(req, res) {
    res.json(req.user);
  }
);

app.get('/users',
  passport.authenticate('basic', { session: false }),
  function(req, res) {
    Users.all(req.app._rdbConn)
      .then(function(users) {
        res.json(users);
      })
      .catch(function() {
        res.status(500);
      });
  }
);

app.get('/questions/current',
  passport.authenticate('basic', { session: false }),
  function(req, res) {
    Questions.all(req.app._rdbConn)
      .then(function(questions) {
        res.json(questions[0]);
      })
      .catch(function(err) {
        res.status(500).json({ message: err });
      });
  }
);

app.post('/answers',
  passport.authenticate('basic', { session: false }),
  function(req, res) {
    Game.saveAnswer(
      req.app._rdbConn,
      req.user.id,
      req.body.questionId,
      req.body.answerId
    )
      .then(function(answer) {
        console.log('answer', answer);
        res.json(answer);
      })
      .catch(function(err) {
        console.log('err', err);
        res.status(500).json({ message: err });
      });
  }
);


app.use(handle404);
app.use(handleError);

Database.setup(config.rethinkdb)
  .tap(Users.setup)
  .tap(Questions.setup)
  .tap(Answers.setup)
  .tap(Seed.run)
  .tap(Game.setup)
  .then(startExpress)
  .catch(function(err) {
    console.error(err);
    throw err;
  });

function startExpress(connection) {
  app._rdbConn = connection;
  app.listen(config.express.port);
  console.log('Listening on port ' + config.express.port);
}

function handle404(req, res, next) {
  res.status(404).end('not found');
}

function handleError(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({err: err.message});
}

process.on('uncaughtException', function (er) {
  console.error(er.stack);
  process.exit(1);
});
