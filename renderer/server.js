var express = require('express');

require('crocodile-js/apps').buildApps({path: __dirname + '/croc.js'},
    function(error, apps) {
        if (error) {
            throw error;
        }
        
        var app = apps[0];
        var expressApp = express()
            .get('/', function(req, res) {
                var page = app.createPage(null, res);
                page.model.set('_page.title', 'Crocodile JS API reference');
                page.model.set('_page.api', require('./data.json'));
                page.render('index');
            });
        require('crocodile-js/middleware')(expressApp, apps);
        
        expressApp.listen(3001, function(err) {
            if (!err) {
                console.log('http://localhost:3001/');
            }
            else {
                throw err;
            }
        });
    });