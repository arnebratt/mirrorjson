let db = require('../lib/database'),
    handlebars = require('handlebars');

// List all elements registered in the database for the selected domain
let listElements = function(req, res, status = "") {
    const SHOW_PATH_LENGTH = 60;
    const SHOW_JSON_LENGTH = 600;
    const GROUP_IN_SECONDS = 15;
    db.getSiteElements(req.params.domain, res, function(err, results) {
        let previous = results[0].lastAccessed;
        let isNotTogether = false;
        let list = results.map(json => {
            isNotTogether = ((previous - json.lastAccessed) / 1000) >= GROUP_IN_SECONDS;
            previous = json.lastAccessed;
            return {
                hash: json.hash,
                path: json.path ? json.path.substring(0, SHOW_PATH_LENGTH) + (json.path.length > SHOW_PATH_LENGTH ? "...+" + (json.path.length - SHOW_PATH_LENGTH) : "") : '',
                statusCode: json.statusCode,
                json: json.json.substring(0, SHOW_JSON_LENGTH) + (json.json.length > SHOW_JSON_LENGTH ? "...+" + (json.json.length - SHOW_JSON_LENGTH) : ""),
                isNotTogether: isNotTogether
            }
        });
        res.render('elementslist', {results: list, selectedDomain: req.params.domain, status: status});
    });
}

// Add json data for the current domain and specified hash
let addJson = function(req, res) {
    let hash = (req.body.hash) ? req.body.hash : null;
    let method = (req.body.method) ? req.body.method : 'GET';
    let path = method + ' ' + decodeURI(req.body.path);
    let statusCode = (req.body.statuscode) ? req.body.statuscode : 200;

    if (path || hash) {
        try {
            let setProtected = (req.body.setprotected) ? true : false;
            let headers = JSON.parse(req.body.headers);
            db.storeData(req.params.domain, hash, path, statusCode, req.body.headers, req.body.jsondata, setProtected, function(err, numberAffected) {
                db.updateHeadersList(req.params.domain, false, headers, res, function(err, sendHeaders) {
                    listElements(req, res, "Json stored for " + (hash ? "hash '" + hash : "path '" + path) + "'");
                });
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
                return {hash: data.hash, path: data.path, statusCode: data.statusCode, header: data.header, json: data.json, isProtected: data.isProtected}
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
                    db.storeData(req.params.domain, data.hash, data.path, data.statusCode ? data.statusCode : 200, data.headers, JSON.stringify(data.json), data.isProtected);
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

// Update forward headers settings for currently selected domain
exports.adminForwardHeaders = function(req, res) {
    db.getHeadersList(req.params.domain, true, res, function(res, err, headers) {
        Object.keys(headers).forEach(header => headers[header] = (req.body[header] ? true : false));
        db.updateHeadersList(req.params.domain, true, headers);
        res.render('headerselection', {selectedDomain: req.params.domain, headers: headers, isForwardHeaders: true, status: "Updated headers selection"});
    });
}

exports.adminForwardHeadersPage = function(req, res) {
    db.getHeadersList(req.params.domain, true, res, function(res, err, headers) {
        res.render('headerselection', {selectedDomain: req.params.domain, headers: headers, isForwardHeaders: true});
    });
}

// Update return headers settings for currently selected domain
exports.adminReturnHeaders = function(req, res) {
    db.getHeadersList(req.params.domain, false, res, function(res, err, headers) {
        Object.keys(headers).forEach(header => headers[header] = (req.body[header] ? true : false));
        db.updateHeadersList(req.params.domain, false, headers);
        res.render('headerselection', {selectedDomain: req.params.domain, headers: headers, isForwardHeaders: false, status: "Updated headers selection"});
    });
}

exports.adminReturnHeadersPage = function(req, res) {
    db.getHeadersList(req.params.domain, false, res, function(res, err, headers) {
        res.render('headerselection', {selectedDomain: req.params.domain, headers: headers, isForwardHeaders: false});
    });
}

exports.adminJsonEditor = function(req, res) {
    db.getElement(req.params.domain, req.params.hash, null, res, function(res, err, currentData) {
        if (currentData) {
            res.render('jsoneditor', {
                statusCode: currentData.statusCode,
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
