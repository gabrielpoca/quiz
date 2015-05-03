var app = require('./app');
var config = require(__dirname + '/config.js');

var Database = require('./database');
var Game = require('./game');

var startExpress = function(DB) {
  app(DB).listen(config.express.port);
  console.log('Listening on port ' + config.express.port);
};

var startGame = function(DB) {
  return Game(DB).start();
};

Database
  .tap(startExpress)
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
