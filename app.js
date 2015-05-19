var R = require('ramda');
var bodyParser = require('body-parser');
var fs = require('fs');
var express = require('express.io');
var morgan = require('morgan');
var BasicStrategy = require('passport-http').BasicStrategy;
var passport = require('passport');
var cors = require('cors');

var logDirectory = __dirname + '/log';
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

var accessLogStream = fs.createWriteStream(logDirectory + '/access.log', { flags: 'a' })

module.exports = function(DB) {
  var app = express();

  passport.use(new BasicStrategy({}, function(username, password, done) {
    var params = { username: username };

    DB.Users.findByParams(params)
      .then(R.head)
      .then(function(user) {
        if (!user) throw 'not authorized';

        return DB.Utils.eqPasswords(password, user.password)
          .then(function() {
            return done(null, user);
          });
      })
      .catch(function(err) {
        done(null, false, { message: 'You are not authorized' });
      });
  }));

  app.use(morgan('tiny', { stream: accessLogStream }));
  app.use(cors());
  app.use(passport.initialize());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.http().io();

  app.post('/register', function(req, res) {
    DB.Users.insert(req.body)
      .then(function(user) {
        res.json(user);
      })
      .catch(function(err) {
        res.status(500).json({ error: err });
      });
  });

  app.get('/me',
    passport.authenticate('basic', { session: false }),
    function(req, res) {
      res.json(req.user);
    }
  );

  app.get('/users',
    passport.authenticate('basic', { session: false }),
    function(req, res) {
      DB.Users.all()
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
      DB.Questions.all()
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
      var params = {
        userId: req.user.id,
        questionId: req.body.questionId,
        answerId: req.body.answerId
      };

      DB.Answers.insertGameAnswer(params)
        .then(function(answer) {
          res.json(answer);
        })
        .catch(function(err) {
          res.status(500).json({ message: err });
        });
    }
  );

  app.use(function handle404(req, res) {
    res.status(404).end('not found');
  });

  app.use(function handleError(err, req, res) {
    console.error(err.stack);
    res.status(500).json({err: err.message});
  });

  DB.Broadcast.subscribe(function(cursor) {
    cursor.each(function(err, object) {
      app.io.broadcast(object.topic, object.args);
    });
  });

  DB.Users.changes().then(function(cursor) {
    cursor.each(function(err, user) {
      if (err) return;

      app.io.broadcast('users:update', user);
    });
  });

  return app;
};
