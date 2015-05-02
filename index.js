var bodyParser = require('body-parser');
var express = require('express');
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var r = require('rethinkdb');
var R = require('ramda');

var app = express();
var config = require(__dirname + '/config.js');

var Database = require('./database');
var Users = require('./users');

passport.use(new BasicStrategy({}, function(username, password, done) {
  var params = { username: username };

  Users.findByParams(app._rdbConn, params)
    .then(function(users) {
      return users.next().then(function(user) {
        done(null, user);
      });
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
      res.status(500).send({ error: err });
    });
});

app.get('/me', passport.authenticate('basic', { session: false }),
  function(req, res) {
    Users.insert(req.app._rdbConn, req.body)
      .then(function(user) {
        res.json(user);
      })
      .catch(function(err) {
        res.status(500).send({ error: err });
      });
  });

app.get('/users',
  passport.authenticate('basic', { session: false }),
  function(req, res, next) {
    Users.all(req.app._rdbConn)
      .then(function(users) {
        res.json(users);
      })
      .catch(function() {
        res.status(500);
      });
  });


app.use(handle404);
app.use(handleError);

Database.setup(config.rethinkdb)
  .tap(Users.setup)
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
