var options = {
  default: {
    workspace: '/tmp/github-monitor',
    deployTo: '/tmp/deploy_to',
    repositoryUrl: 'git@github.com:gabrielpoca/quiz.git',
    ignores: ['.git', 'node_modules', 'rethinkdb_data'],
    rsync: ['--del'],
    keepReleases: 2,
    shallowClone: true
  },
  npm: {
    remote: true
  },
  nvm: {
    remote: true,
    sh: '/home/deploy/.nvm/nvm.sh'
  },
  staging: {
    servers: 'deploy@178.62.80.104'
  }
};

module.exports = function(shipit) {
  require('shipit-deploy')(shipit);
  require('shipit-npm')(shipit);
  require('shipit-nvm')(shipit);

  shipit.initConfig(options);

  shipit.task('start', function() {
    return shipit.remote('sudo restart quiz');
  });

  shipit.on('published', function() {
    return shipit.start('start');
  });
};
