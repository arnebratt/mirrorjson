var express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    busboy = require('connect-busboy'),
    port = 3001;

require("./models/json");
require("./models/domain_match");
let dataCtrl = require("./controllers/data");
let domainCtrl = require("./controllers/domains");
let elementsCtrl = require("./controllers/elements");

// Check command line parameters
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
    if (val === "--disable-external") {
        dataCtrl.enableExternal(false);
    }
});

// Connect to Mongo DB database
var mongoUri = 'mongodb://localhost/mirrorjson';
var promise = mongoose.connect(mongoUri, {useMongoClient: true});

promise.then(function (db) {
    db.on('error', function () {
        throw new Error('Unable to connect to database at ' + mongoUri);
    });

    try {
        app.use(busboy());
        app.use(bodyParser.json()); // support json encoded bodies
        app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

        app.use("/jsoneditor/dist", express.static('node_modules/jsoneditor/dist/'));

        // Connect routes with controllers
        app.post(["/mirrorjson/:domain/import"], elementsCtrl.adminElementsImport);
        app.get(["/mirrorjson/:domain/import"], elementsCtrl.adminElementsImportPage);
        app.get(["/mirrorjson/:domain/:hash"], elementsCtrl.adminJsonEditor);
        app.post(["/mirrorjson/:domain"], elementsCtrl.adminElementsList);
        app.get(["/mirrorjson/:domain"], elementsCtrl.adminElementsList);
        app.post(["/mirrorjson"], domainCtrl.adminDomainList);
        app.get(["/mirrorjson"], domainCtrl.adminDomainList);
        app.get(["/*"], dataCtrl.postData);
        app.post(["/*"], dataCtrl.postData);
    } catch(err) {
        console.log(err);
    }
});

// Start server on selected port
app.listen(port);

console.log("> node server.js [--port=<port>] [--disable-external]");
console.log("");
console.log("Port must be between 0 and 65536. Default is 3001.");
console.log("When --disable-external is set, only local database data is returned.");
console.log("");
console.log("Listening on port " + port);
console.log("");
