var config = require('./config.js');

var App = require('./app');
var Database = require('./database');
var Game = require('./game');

var startGame = function(DB) {
  var app = App(DB, config.express.port)
  console.log('Listening on port ' + config.express.port);

  return Game(DB).start();
};

Database
  .tap(startGame)
  .catch(function(err) {
    if (err.stack)
      console.error(err.stack);
    else
      console.error(err);

    throw err;
  });

process.on('uncaughtException', function(er) {
  console.error(er.stack);
  process.exit(1);
});
