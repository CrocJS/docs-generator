var spawn = require('child_process').spawn;
var _ = require('lodash');
var child;
var chokidar = require('chokidar');

var restart = _.debounce(function() {
    if (child) {
        console.log('restart');
        child.kill();
    }
    child = spawn('node', ['server.js'], {stdio: 'inherit'});
}, 100);

chokidar
    .watch('.', {
        ignored: /[\/\\]\.|node_modules|bower_components/,
        ignorePermissionErrors: true,
        ignoreInitial: true
    })
    .on('all', restart);

chokidar
    .watch('../node_modules/crocodile-js', {
        ignored: /[\/\\]\.|crocodile-js\/node_modules/,
        ignorePermissionErrors: true,
        ignoreInitial: true
    })
    .on('all', restart);

chokidar
    .watch('../node_modules/crocodile-js/node_modules/derby', {
        ignored: /[\/\\]\.|derby\/node_modules/,
        ignorePermissionErrors: true,
        ignoreInitial: true
    })
    .on('all', restart);

restart();