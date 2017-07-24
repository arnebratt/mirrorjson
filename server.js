var express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    port = 3001;

process.argv.forEach(function (val, index, array) {
    if (val.indexOf("--port=") === 0) {
        let tmpPort = parseInt(val.split("=")[1]);
        if (tmpPort > 0 && tmpPort < 65536) {
            port = tmpPort;
        } else {
            console.log("Error: --port parameter has the wrong format, exiting");
            process.exit();
        }
    }
});

var mongoUri = 'mongodb://localhost/test';
var promise = mongoose.connect(mongoUri, {useMongoClient: true});

promise.then(function (db) {
    db.on('error', function () {
        throw new Error('Unable to connect to database at ' + mongoUri);
    });

    try {
        require("./models/json");
        require("./models/domain_match");
        let dataCtrl = require("./controllers/data");
        let domainCtrl = require("./controllers/domains");

        app.get(["/mirrorjson"], domainCtrl.adminDomainRegister);
        app.get(["/*"], dataCtrl.getData);
    } catch(err) {
        console.log(err);
    }
});

app.listen(port);

console.log("> node server.js [--port=<port>]");
console.log("");
console.log("Port must be between 0 and 65536. Default is 3001.");
console.log("");
console.log("Listening on port " + port);
console.log("");
