var express = require('express'),
	app = express(),
	mongoose = require('mongoose');

var mongoUri = 'mongodb://localhost/test';
var promise = mongoose.connect(mongoUri, {useMongoClient: true});

promise.then(function (db) {
	db.on('error', function () {
	  throw new Error('Unable to connect to database at ' + mongoUri);
	});

    try {
        require("./models/json");
        let dataCtrl = require("./controllers/data");

    	app.get(["/*"], dataCtrl.getData);
    } catch(err) {
        console.log(err);
    }
});

app.listen(3001);
console.log('Listening on port 3001...');