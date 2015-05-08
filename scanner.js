var path = require('path');

var Q = require('q');
var glob = Q.denodeify(require('glob'));
var _ = require('lodash');
var objectPath = require('object-path');

var parser = require('./fileParser');

exports.scan = function(paths, sources) {
    return Q.all(paths.map(function(curPath) {
        return glob(_.trimRight(curPath, '/') + '/**/*.js');
    }))
        .then(function(results) {
            results = _.flatten(results);
            return Q.all(results.map(function(filePath) {
                var source = _.find(sources, function(source) {
                    return _.contains(filePath, source.path);
                });
                return parser.parse(filePath, source && (source.url + '/' + path.relative(source.path, filePath)));
            }));
        })
        .then(function(results) {
            results = _.compact(results);
            var result = {
                map: _.indexBy(results, 'qualifiedName'),
                tree: []
            };
            
            var tree = result.tree;
            results.forEach(function(desc) {
                var nodeItems = tree;
                var parentName;
                var segments = desc.qualifiedName.split('.');
                var packageName = '';
                segments.forEach(function(chunk, i) {
                    var lastPackName = packageName;
                    packageName += (packageName && '.') + chunk;
                    var pack = _.find(nodeItems, {name: chunk});
                    if (!pack) {
                        var index = _.sortedIndex(nodeItems, chunk, function(node) {
                            return typeof node === 'string' ? node : node.name;
                        });
                        nodeItems.splice(index, 0, pack = {
                            name: chunk,
                            packageName: packageName,
                            parent: parentName
                        });
                    }
                    if (i < segments.length - 1) {
                        parentName = pack.name;
                        nodeItems = pack.items || (pack.items = []);
                    }
                    else {
                        pack.object = desc.qualifiedName;
                        pack.packageName = lastPackName;
                    }
                });
            });
            
            function processTree(nodeItems) {
                var copy = nodeItems.concat();
                nodeItems.sort(function(a, b) {
                    return a.items && !b.items ? -1 : !a.items && b.items ? 1 : copy.indexOf(a) - copy.indexOf(b);
                });
                nodeItems.forEach(function(node) {
                    if (node.object && node.items) {
                        node.items.unshift({
                            name: '$index',
                            object: node.object,
                            qualifiedName: node.qualifiedName,
                            parentName: node.name
                        });
                        //result.map[node.object].isPackage = true;
                        delete node.object;
                    }
                    if (node.items) {
                        processTree(node.items);
                    }
                });
            }
            
            processTree(tree);
            
            return result;
        });
};