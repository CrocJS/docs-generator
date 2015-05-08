var path = require('path');
var fs = require('fs');

module.exports = function(dataFile, callback) {
    var progress = 0;
    
    function progressUp() {
        if (++progress === 2) {
            callback();
        }
    }
    
    var app = require('./app');
    app.writeScripts(function() {
        var page = app.createPage(null, dataFile);
        page.derbyBundle = function(bundle) {
            var bundleUrl = 'compiled/doc.data.js';
            fs.writeFile(path.join(app.publicDir, bundleUrl), '$derbyModel = ' + bundle, progressUp);
            return '<script src="' + bundleUrl + '" id="derby-bundle"></script>';
        };
        var html = page.renderString('index');
        fs.writeFile(app.publicDir + '/index.html', html, progressUp);
    });
};
