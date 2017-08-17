let mongoose = require('mongoose'),
    md5 = require('md5');

let Domain = mongoose.model('Domain');
let Data = mongoose.model('Data');

/* HANDLE DOMAINS */

exports.getDomains = function(res, callback) {
    Domain.find({}, function(err, results) {
        if (results) {
            callback(results);
        } else {
            console.log(err);
            return res.send("Error: Failed getting domains list");
        }
    });
}

exports.getDomainElementsCount = function(callback) {
    Data.aggregate({$group: {_id: {domainId: "$domainId"}, elementsCount: {$sum: 1}}}, function(err, aggrResults) {
        let countDocs = {};
        aggrResults.map(aggr => {countDocs[aggr._id.domainId] = aggr.elementsCount});
        callback(countDocs);
    });
}

exports.updateDomain = function(localDomain, remoteDomain, res, callback) {
    Domain.findOne({localDomain: localDomain}, function(err, results) {
        if (results) {
            Domain.update({localDomain: localDomain}, {$set: {remoteDomain: remoteDomain}}, function (err, numberAffected) {
                if (!err) {
                    callback(false);
                } else {
                    console.log(err);
                    return res.send("Error: Failed updating domain reference for " + localDomain);
                }
            });
        } else {
            Domain.create({localDomain: localDomain, remoteDomain: remoteDomain}, function (err, domain) {
                if (domain) {
                    callback(true);
                } else {
                    console.log(err);
                    return res.send("Error: Failed creating domain reference for " + localDomain);
                }
            });
        }
    });    
}

exports.removeDomain = function(localDomain, res, callback) {
    Domain.findOne({localDomain: localDomain}, function(err, results) {
        if (results) {
            Domain.remove({localDomain: localDomain}, function (err, writeOpResult) {
                if (!err) {
                    callback();
                } else {
                    console.log(err);
                    return res.send("Error: Failed removing domain reference for " + localDomain);
                }
            });
        }
    });
}

/* HANDLE JSON ELEMENTS */

// Save json from given path or hash
exports.storeData = function(localDomain, hash, path, json, isProtected, callback) {
    Domain.findOne({localDomain: localDomain}, "_id", function(err, currentSite) {
        if (currentSite) {
            if (!hash) {
                hash = md5(path);
            }
            Data.findOne({domainId: currentSite._id, hash: hash}, function(err, results) {
                if (results) {
                    let newData = (typeof isProtected === "boolean") ? {json: json, isProtected: isProtected} : {json: json};
                    Data.update({domainId: currentSite._id, hash: hash}, {$set: newData}, function (err, numberAffected) {
                        console.log('Updated %d documents...', numberAffected.nModified, err);
                        if (callback) {
                            callback(err, numberAffected);
                        }
                    });
                } else {
                    let newData = {domainId: currentSite._id, hash: hash, path: path, json: json, isProtected: isProtected === true};
                    Data.create(newData, function(err, data) {
                        console.log('Created new document...', err);
                        if (callback) {
                            callback();
                        }
                    });
                }
            });
        }
    });
}

// Generate external url based on current domain
exports.getExternalUrl = function(protocol, localDomain, path, callback) {
    Domain.findOne({localDomain: localDomain}, function(err, results) {
        if (results) {
            let fullUrl = protocol + '://' + results.remoteDomain + path;
            callback(fullUrl);
        } else {
            console.log(err);
            return res.send("Error: Remote domain not found on " + localDomain);
        }
    });
}

// Get json data based on given hash/path and current site
exports.getElement = function(localDomain, hash, path, res, callback) {
    Domain.findOne({localDomain: localDomain}, "_id", function(err, currentSite) {
        if (currentSite) {
            if (!hash) {
                hash = md5(path);
            }
            Data.findOne({domainId: currentSite._id, hash: hash}, function(err, results) {
                callback(res, err, results);
            });
        } else {
            return res.send("Error: Local domain not registered, " + localDomain)
        }
    });
}

// Get all elements in selected site
exports.getSiteElements = function(localDomain, res, callback) {
    Domain.findOne({localDomain: localDomain}, "_id", function(err, currentSite) {
        if (currentSite) {
            Data.find({domainId: currentSite._id}, function(err, results) {
                callback(err, results);
            });
        } else {
            return res.send("Error: Local domain not registered, " + localDomain)
        }
    });
}
