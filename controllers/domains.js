let mongoose = require('mongoose');
let handlebars = require('handlebars');

let Domain = mongoose.model('Domain');
let Data = mongoose.model('Data');

let domainListTpl = require('../templates/domainlist.handlebars');

// List all domains registered in the database
let listDomains = function(req, res, status = "") {
    Domain.find({}, function(err, results) {
        if (results) {
            let currentDomain = results.find(domain => domain.localDomain === req.get('host'));
            Data.aggregate({$group: {_id: {domainId: "$domainId"}, elementsCount: {$sum: 1}}}, function(err, aggrResults) {
                let countDocs = {};
                aggrResults.map(aggr => {countDocs[aggr._id.domainId] = aggr.elementsCount});

                let template = handlebars.compile(domainListTpl.tpl());
                res.send(template({results: results, countDocs: countDocs, currentDomain: currentDomain, status: status}));
            });
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
                    listDomains(req, res, "Added a new domain to " + req.get('host'));
                } else {
                    console.log(err);
                    return res.send("Error: Failed updating domain reference for " + req.query.domain);
                }
            });
        } else {
            Domain.create({localDomain: req.get('host'), remoteDomain: req.query.domain}, function (err, domain) {
                if (domain) {
                    listDomains(req, res, "Updated the domain to " + req.get('host'));
                } else {
                    console.log(err);
                    return res.send("Error: Failed creating domain reference for " + req.query.domain);
                }
            });
        }
    });
}

// Remove the current domains document
let removeDomain = function(req, res) {
    getDomain(req.get('host'), req, res, results => {
        if (results) {
            Domain.remove({localDomain: req.get('host')}, function (err, writeOpResult) {
                if (!err) {
                    listDomains(req, res, "Removed the domain to " + req.get('host'));
                } else {
                    console.log(err);
                    return res.send("Error: Failed removing domain reference for " + req.get('host'));
                }
            });
        }
    });
}

// Add json data for the current domain and specified path
let addJson = function(req, res) {
    let dataCtrl = require("../controllers/data");
    let ObjectId = require('mongoose').Types.ObjectId;

    if (req.query.path) {
        try {
            JSON.parse(req.query.jsondata);
            Domain.findOne({localDomain: req.get('host')}, "_id", function(err, currentSite) {
                if (currentSite) {
                    dataCtrl.storeData(req.get('host'), req.query.path, req.query.jsondata);
                    Data.find({domainId: new ObjectId(currentSite._id)}, function(err, results) {
                        if (results) {
                            res.send("<pre>\n" + results.map(data => "\n" + data.hash + " => " + data.json.substring(0, 40)) + "...</pre>\n");
                        } else {
                            console.log(err);
                            return res.send("Error: Failed getting current site data for domain " + req.get('host'));
                        }
                    });
                } else {
                    return res.send("Error: Local domain not registered, " + req.get('host'))
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
    } else if (req.query.remove_domain) {
        removeDomain(req, res);
    } else if (req.query.jsondata) {
        addJson(req, res);
    } else {
        listDomains(req, res);
    }
}