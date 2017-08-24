let db = require('../lib/database'),
    handlebars = require('handlebars');

// List all elements registered in the database for the selected domain
let listElements = function(req, res, status = "") {
    const SHOW_PATH_LENGTH = 60;
    const SHOW_JSON_LENGTH = 600;
    db.getSiteElements(req.params.domain, res, function(err, results) {
        let list = results.map(json => ({
            hash: json.hash,
            path: json.path ? json.path.substring(0, SHOW_PATH_LENGTH) + (json.path.length > SHOW_PATH_LENGTH ? "...+" + (json.path.length - SHOW_PATH_LENGTH) : "") : '',
            json: json.json.substring(0, SHOW_JSON_LENGTH) + (json.json.length > SHOW_JSON_LENGTH ? "...+" + (json.json.length - SHOW_JSON_LENGTH) : "")
        }));
        res.render('elementslist', {results: list, selectedDomain: req.params.domain, status: status});
    });
}

// Add json data for the current domain and specified hash
let addJson = function(req, res) {
    let hash = (req.body.hash) ? req.body.hash : null;
    let path = decodeURI(req.body.path);

    if (path || hash) {
        try {
            let setProtected = (req.body.setprotected) ? true : false;
            JSON.parse(req.body.headers);
            JSON.parse(req.body.jsondata);
            db.storeData(req.params.domain, hash, path, req.body.headers, req.body.jsondata, setProtected, function(err, numberAffected) {
                listElements(req, res, "Json stored for " + (hash ? "hash '" + hash : "path '" + path) + "'");
            })
        } catch(e) {
            res.send("Error: json data conversion failed for :\n" + req.body.jsondata + "\n\n" + req.body.headers);
        }
    } else {
        res.send("Error: Missing path information");
    }
}

// Export all elements for this domain
let exportJson = function(req, res) {
    db.getSiteElements(req.params.domain, res, function(err, results) {
        let docs = results.map(data => {
            try {
                return {hash: data.hash, path: data.path, header: data.header, json: JSON.parse(data.json), isProtected: data.isProtected}
            } catch(e) {
                res.send("Error: json data conversion failed for :\n" + data.json);
            }
        });

        res.setHeader('Content-disposition', 'attachment; filename=mirrorjson.json');
        res.set("Content-Type", "application/json");
        res.send(docs);
    });
}

// Import elements from a json file to this domain
exports.adminElementsImport = function(req, res) {
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        const chunks = [];

        file.on("data", function (chunk) {
            chunks.push(chunk);
        });

        file.on("end", function () {
            try {
                let jsondata = JSON.parse(chunks.join(''));
                jsondata.forEach(data => {
                    db.storeData(req.params.domain, data.hash, data.path, data.headers, JSON.stringify(data.json), data.isProtected);
                });
                res.render('elementsimport', {selectedDomain: req.params.domain, status: "Updated data from file " + filename});
            } catch(err) {
                console.log(err);
                res.send("Error: json data conversion failed for :\n" + chunks.join(''));
            }
        });
    });
}

exports.adminElementsImportPage = function(req, res) {
    res.render('elementsimport', {selectedDomain: req.params.domain});
}

exports.adminForwardHeaders = function(req, res) {
    res.render('headerselection', {selectedDomain: req.params.domain, headers: {setcookie: true, cookie: false}});
}

exports.adminForwardHeadersPage = function(req, res) {
    res.render('headerselection', {selectedDomain: req.params.domain, headers: {setcookie: true, cookie: false}});
}

exports.adminReturnHeaders = function(req, res) {
    res.render('headerselection', {selectedDomain: req.params.domain, headers: {}});
}

exports.adminReturnHeadersPage = function(req, res) {
    res.render('headerselection', {selectedDomain: req.params.domain, headers: {}});
}

exports.adminJsonEditor = function(req, res) {
    db.getElement(req.params.domain, req.params.hash, null, res, function(res, err, currentData) {
        if (currentData) {
            res.render('jsoneditor', {
                headers: currentData.headers || '{}',
                json: currentData.json,
                hash: currentData.hash,
                domain: req.params.domain,
                isProtected: currentData.isProtected
            });
        } else {
            return res.send("Error: Requested data not found");
        }
    });
}

exports.adminElementsList = function(req, res) {
    if (req.body.jsondata) {
        addJson(req, res);
    } else if (req.body.export) {
        exportJson(req, res);
    } else {
        listElements(req, res);
    }
}
