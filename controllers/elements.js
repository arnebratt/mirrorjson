let mongoose = require('mongoose'),
    handlebars = require('handlebars')
    md5 = require('md5');

let Domain = mongoose.model('Domain');
let Data = mongoose.model('Data');

let elementsListTpl = require('../templates/elementslist.handlebars');

// List all elements registered in the database for the selected domain
let listElements = function(req, res, status = "") {
    Domain.findOne({localDomain: req.params.domain}, "_id", function(err, currentSite) {
        if (currentSite) {
            Data.find({domainId: currentSite._id}, function(err, results) {
                let list = results.map(json => {return {
                    hash: json.hash,
                    json: json.json.substring(0, 300) + (json.json.length > 300 ? "...+" + (json.json.length - 300) : "")
                };});
                let template = handlebars.compile(elementsListTpl.tpl());
                res.send(template({results: list, selectedDomain: req.params.domain, status: status}));
            });
        } else {
            return res.send("Error: Local domain not registered, " + site)
        }
    });
}

// Add json data for the current domain and specified hash
let addJson = function(req, res) {
    let dataCtrl = require("../controllers/data");
    let ObjectId = require('mongoose').Types.ObjectId;
    let hash = undefined;

    if (req.body.path) {
        hash = md5(decodeURI(req.body.path));
    } else if (req.body.hash) {
        hash = req.body.hash;
    }
    if (hash) {
        try {
            JSON.parse(req.body.jsondata);
            Domain.findOne({localDomain: req.get('host')}, "_id", function(err, currentSite) {
                if (currentSite) {
                    dataCtrl.storeData(req.get('host'), hash, req.body.jsondata, function(err, numberAffected) {
                        listElements(req, res, "Json stored for hash " + hash);
                    });
                } else {
                    return res.send("Error: Local domain not registered, " + req.get('host'))
                }
            });
        } catch(e) {
            res.send("Error: json data conversion failed for :\n" + req.body.jsondata);
        }
    } else {
        res.send("Error: Missing path information");
    }
}

let exportJson = function(req, res) {
    Domain.findOne({localDomain: req.params.domain}, "_id", function(err, currentSite) {
        if (currentSite) {
            Data.find({domainId: currentSite._id}, "hash json", function(err, results) {
                let docs = results.map(data => {
                    try {
                        return {hash: data.hash, json: JSON.parse(data.json)}
                    } catch(e) {
                        res.send("Error: json data conversion failed for :\n" + data.json);
                    }
                });

                res.setHeader('Content-disposition', 'attachment; filename=mirrorjson.json');
                res.set("Content-Type", "application/json");
                res.send(docs);
            });
        } else {
            return res.send("Error: Local domain not registered, " + site)
        }
    });
}

exports.adminElementsImport = function(req, res) {
    console.log(req.body);
    if (req.body.jsonfile) {
        req.pipe(req.busboy);
        req.busboy.on('file', function (fieldname, file, filename) {
            console.log("Uploading: " + filename);
            console.log(file);
            file.on('data', (chunk) => {
                console.log(`Received ${chunk.length} bytes of data.`);
            });
        });
        let jsonEditorTpl = require('../templates/elementsimport.handlebars');
        let template = handlebars.compile(jsonEditorTpl.tpl());
        res.send(template({selectedDomain: req.params.domain}));
    } else {
        let jsonEditorTpl = require('../templates/elementsimport.handlebars');
        let template = handlebars.compile(jsonEditorTpl.tpl());
        res.send(template({selectedDomain: req.params.domain}));
    }
}

exports.adminJsonEditor = function(req, res) {
    Data.findOne({hash: req.params.hash}, function(err, currentData) {
        if (currentData) {
            let jsonEditorTpl = require('../templates/jsoneditor.handlebars');
            let template = handlebars.compile(jsonEditorTpl.tpl());
            res.send(template({json: currentData.json, hash: currentData.hash, domain: req.params.domain}));
        } else {
            return res.send("Error: Requested data not found, " + req.params.hash)
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
