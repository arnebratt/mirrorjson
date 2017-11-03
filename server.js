var express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    busboy = require('connect-busboy'),
    hbs = require('hbs'),
    packageJson = require('./package.json'),
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
    if (val === "--include-post-data") {
        dataCtrl.includePostData(true);
    }
    if (val.indexOf("--delay-on-response") === 0) {
        let tmpDelay = parseInt(val.split("=")[1]);
        if (tmpDelay > 0 && tmpDelay < 600) {
            dataCtrl.setDelayOnResponse(tmpDelay);
        } else {
            console.log("Error: --delay-on-response parameter has the wrong format, exiting");
            process.exit();
        }
    }
});

// Connect to Mongo DB database
var mongoUri = 'mongodb://localhost/mirrorjson';
mongoose.connect(mongoUri, {useMongoClient: true});

mongoose.connection.on('error', function () {
    console.log(err);
    throw new Error('Unable to connect to database at ' + mongoUri);
});

try {
    // For handling HTTP file upload
    app.use(busboy());
    // Support HTTP POST json encoded bodies and encoded bodies
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.raw());
    // Configuring Handlebars template engine
    app.set('view engine', 'hbs');
    app.set('views', './templates');
    hbs.registerPartials('./templates/partials');
    hbs.localsAsTemplateData(app);
    app.locals.version = packageJson.version;

    // Static file routes
    app.use('/mirrorjson/LICENSE.md', express.static('LICENSE.md'));
    app.use("/jsoneditor/dist", express.static('node_modules/jsoneditor/dist/'));

    // Administration interface routes
    app.post(["/mirrorjson/:domain/forwardheaders"], elementsCtrl.adminForwardHeaders);
    app.get(["/mirrorjson/:domain/forwardheaders"], elementsCtrl.adminForwardHeadersPage);
    app.post(["/mirrorjson/:domain/returnheaders"], elementsCtrl.adminReturnHeaders);
    app.get(["/mirrorjson/:domain/returnheaders"], elementsCtrl.adminReturnHeadersPage);
    app.post(["/mirrorjson/:domain/import"], elementsCtrl.adminElementsImport);
    app.get(["/mirrorjson/:domain/import"], elementsCtrl.adminElementsImportPage);
    app.get(["/mirrorjson/:domain/:hash"], elementsCtrl.adminJsonEditor);
    app.post(["/mirrorjson/:domain"], elementsCtrl.adminElementsList);
    app.get(["/mirrorjson/:domain"], elementsCtrl.adminElementsList);
    app.post(["/mirrorjson"], domainCtrl.adminDomainList);
    app.get(["/mirrorjson"], domainCtrl.adminDomainList);

    // Any urls to pass on to external API
    app.all(["/*"], dataCtrl.postData);
} catch(err) {
    console.log(err);
}

// Start server on selected port
app.listen(port);

console.log("> node server.js [--port=<port>] [--disable-external] [--include-post-data] [--delay-on-response=<delay>]");
console.log("");
console.log("Port must be between 0 and 65536. Default is 3001.");
console.log("When --disable-external is set, only local database data is returned.");
console.log("When --include-post-data is set, POST/PUT data are included in url match. You can then return multiple results depending on the data sent in.");
console.log("--delay-on-response can specify a delay in seconds to delay the response (can be set between 0 and 600). It will allow you to test a slow connection.");
console.log("");
console.log("Listening on port " + port);
console.log("");
