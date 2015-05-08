process.env.DERBY_BOWER_DIR = __dirname;

var path = require('path');

var publicDir = path.resolve(__dirname + '/../public');

var app = require('./source/doc/app');

var derby = require('crocodile-js');
derby.use(require('racer-bundle'));

module.exports = {
    publicDir: publicDir,

    createPage: function(response, dataFile) {
        var page = app.createPage(null, response);
        page.model.set('_page.title', 'Crocodile JS API reference');
        page.model.set('_page.api', require(dataFile || './data.json'));
        return page;
    },

    writeScripts: function(cb) {
        app.writeScripts(publicDir, {}, function(err) {
            if (err) {
                throw err;
            }
            if (cb) {
                cb(app);
            }
        });
    }
};