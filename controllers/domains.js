let mongoose = require('mongoose');

let Domain = mongoose.model('Domain');

// List all domains registered in the database
let listDomains = function(req, res) {
    Domain.find({}, function(err, results) {
        if (results) {
            res.send("<pre>\n" + results.map(domain => "\n" + domain.localDomain + " <= " + domain.remoteDomain) + "</pre>\n");
        } else {
            console.log(err);
            return res.send("Error: Failed getting domains list");
        }
    });
}

// Get a domain document (with local vs.remote domain)
let getDomain = function(domain, req, res, callback) {
    Domain.findOne({localDomain: domain}, function(err, results) {
        callback((results) ? results : undefined);
    });
}

// Update an existing domain document or create a new one
let updateDomain = function(req, res) {
    getDomain(req.get('host'), req, res, results => {
        if (results) {
            Domain.update({localDomain: req.get('host')}, {$set: {remoteDomain: req.query.domain}}, function (err, numberAffected) {
                if (!err) {
                    listDomains(req, res);
                } else {
                    console.log(err);
                    return res.send("Error: Failed updating domain reference for " + req.query.domain);
                }
            });
        } else {
            Domain.create({localDomain: req.get('host'), remoteDomain: req.query.domain}, function (err, domain) {
                if (domain) {
                    listDomains(req, res);
                } else {
                    console.log(err);
                    return res.send("Error: Failed creating domain reference for " + req.query.domain);
                }
            });
        }
    });
}

// Add json data for the current domain and specified path
let addJson = function(req, res) {
    let dataCtrl = require("../controllers/data");
    let Data = mongoose.model('Data');

    if (req.query.path) {
        try {
            JSON.parse(req.query.jsondata);
            dataCtrl.storeData(req.get('host'), req.query.path, req.query.jsondata);
            Data.find({site: req.get('host')}, function(err, results) {
                if (results) {
                    res.send("<pre>\n" + results.map(data => "\n" + data.hash + " => " + data.json.substring(0, 20)) + "</pre>\n");
                } else {
                    console.log(err);
                    return res.send("Error: Failed getting current site data for domain " + req.get('host'));
                }
            });
        } catch(e) {
            res.send("Error: json data conversion failed for :\n" + req.query.jsondata);
        }
    } else {
        res.send("Error: Missing path information");
    }
}

exports.adminDomainRegister = function(req, res) {
    if (req.query.domain) {
        updateDomain(req, res);
    } else if (req.query.jsondata) {
        addJson(req, res);
    } else {
        listDomains(req, res);
    }
}