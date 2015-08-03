var fs = require('fs');
var path = require('path');

var rimraf = require('rimraf');
var _ = require('lodash');
var Q = require('q');
var program = require('commander');
var mkdirp = require('mkdirp');
var ncp = require('ncp').ncp;
var tmp = require('tmp');
var resolve = require('resolve');

var apiIndex = require('./apiindex');
var scanner = require('./scanner');
var library = require('./library');

var writeFile = Q.denodeify(fs.writeFile);

program
    .option('-g, --git [git]', 'git repository')
    .option('-p, --path [path]', 'path to croc.js', path.join(process.cwd(), 'croc.js'))
    .option('-o, --output [output]', 'path for generated viewer', path.resolve)
    .option('-b, --branch [branch]', 'source version', 'master')
    .option('-d, --data', 'generate data for node version')
    .parse(process.argv);

var promise = Q();
var tmpDir;
var tmpDataFile;
var config;

if (program.git) {
    var gift = require('gift');
    
    promise = Q.denodeify(tmp.dir)()
        .then(function(_tmpDir) {
            tmpDir = _tmpDir;
            program.path = path.join(tmpDir, program.path);
            return Q.denodeify(gift.clone)(program.git, tmpDir);
        })
        .then(function() {
            console.log('Git repository cloned.');
        });
}

promise = promise
    .then(function() {
        if (program.path === 'croc') {
            program.path = path.join(__dirname, 'node_modules/crocodile-js/croc.js');
        }
        else {
            program.path = path.resolve(process.cwd(), program.path);
        }
        var confDir = program.confDir = path.dirname(program.path);
        
        config = require(program.path);
        var root = path.resolve(confDir, config.general.root || '');
        var appPaths = (config.use || [])
            .concat(config.apps.map(function(x) { return x.path; }))
            .map(function(x) { return path.join(root, x); })
            .concat(path.dirname(resolve.sync('crocodile-js', {basedir: confDir})) + '/source/croc');
        var paths = _.flatten(appPaths.map(function(x) { return [path.join(x, 'cmp'), path.join(x, 'js')]; }));
        
        //find source urls
        var sources = [];
        var nodeModulesSplitter = path.sep + 'node_modules' + path.sep;
        var nodeModuleLevel = confDir.split(nodeModulesSplitter).length - 1;
        appPaths.forEach(function(appPath) {
            var crocDir = appPath;
            while (true) {
                var crocFile = path.join(crocDir, 'croc.js');
                
                try {
                    if (fs.existsSync(crocFile)) {
                        var crocConfig = require(crocFile);
                        if (crocConfig.viewSource) {
                            var curNodeModuleLevel = crocDir.split(nodeModulesSplitter).length - 1;
                            var branch = curNodeModuleLevel !== nodeModuleLevel ? 'master' : program.branch;
                            sources.push({
                                path: path.resolve(crocDir, (crocConfig.general && crocConfig.general.root) || ''),
                                url: _.trimRight(crocConfig.viewSource.replace(/\{branch}/g, branch), '/')
                            });
                        }
                        break;
                    }
                }
                catch (ex) {
                    console.log(ex);
                }
                
                var lastCrocDir = crocDir;
                crocDir = path.dirname(crocDir);
                if (crocDir === lastCrocDir) {
                    return;
                }
            }
        });
        
        sources.sort(function(a, b) { return b.path.length - a.path.length; });
        
        return Q.all([
            scanner.scan(paths, sources),
            program.data ? __dirname + '/renderer/data.json' : Q.denodeify(tmp.tmpName)({postfix: '.json'})
        ]);
    })
    .spread(function(data, tmpName) {
        tmpDataFile = tmpName;
        apiIndex(data);
        console.log('Data generated.');
        data.viewSource = '{file}#L{line}';
        return writeFile(tmpDataFile, JSON.stringify(data, null, program.data ? 4 : null));
    });

if (!program.data) {
    promise = promise
        .then(function() {
            return Q.denodeify(require('./renderer/generate-index'))(tmpDataFile);
        })
        .then(function() {
            console.log('Application generated.')
        });
}

if (program.output) {
    promise = Q.all([
        promise,
        Q.denodeify(rimraf)(program.output).then(Q.denodeify(mkdirp)(program.output))
    ])
        .then(function() {
            return Q.denodeify(ncp)('public', program.output, {
                filter: function(file) {
                    return file.indexOf('prototypes') === -1;
                }
            });
        });
}

promise.then(function() {
    if (tmpDir) {
        rimraf(tmpDir, function() {});
    }
    if (tmpDataFile && !program.data) {
        fs.unlink(tmpDataFile);
    }
    console.log('All done!');
}).done();
