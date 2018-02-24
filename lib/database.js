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
            res.status(500);
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
                    Data.deleteMany({domainId: results._id}, function (err, dataResult) {
                        console.log(dataResult ? (dataResult.deletedCount + " documents related to '" + results.remoteDomain + "' deleted.") : err);
                        callback();
                    })
                } else {
                    console.log(err);
                    res.status(500);
                    return res.send("Error: Failed updating domain reference for " + localDomain);
                }
            });
        } else {
            Domain.create({localDomain: localDomain, remoteDomain: remoteDomain}, function (err, domain) {
                if (domain) {
                    callback();
                } else {
                    console.log(err);
                    res.status(500);
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
                    Data.deleteMany({domainId: results._id}, function (err, dataResult) {
                        console.log(dataResult ? (dataResult.deletedCount + " documents related to '" + results.remoteDomain + "' deleted.") : err);
                        callback();
                    })
                } else {
                    console.log(err);
                    res.status(500);
                    return res.send("Error: Failed removing domain reference for " + localDomain);
                }
            });
        }
    });
}

/* HANDLE HEADERS */

// Return a list of current headers on specified domain
exports.getHeadersList = function(localDomain, getForwardHeaders, res, callback) {
    Domain.findOne({localDomain: localDomain}, (getForwardHeaders) ? "forwardHeaders" : "returnHeaders", function(err, currentSite) {
        if (currentSite) {
            callback(res, err, (getForwardHeaders) ? currentSite.forwardHeaders : currentSite.returnHeaders);
        } else {
            res.status(500);
            return res.send("Error: Local domain not registered, " + localDomain)
        }
    });
};

// Update headers for current domain, and return headers that have been selected to pass on
// newHeaders: object of header fields, if field is boolean will update database
// sendHeaders: return array with headers that should be passed on to either external API or frontend
exports.updateHeadersList = function(localDomain, setForwardHeaders, newHeaders, res, callback) {
    Domain.findOne({localDomain: localDomain}, (setForwardHeaders) ? "forwardHeaders" : "returnHeaders", function(err, currentSite) {
        if (currentSite) {
            let headers = currentSite.forwardHeaders || currentSite.returnHeaders || {};
            let sendHeaders = [];
            let isSelected = false;

            for (var header in newHeaders) {
                isSelected = (typeof newHeaders[header] === "boolean") ? newHeaders[header] : (headers[header] || false);
                headers[header] = isSelected;
                if (headers[header]) {
                    sendHeaders.push(header);
                }
            }

            Domain.update({_id: currentSite._id}, {$set: (setForwardHeaders ? {forwardHeaders: headers} : {returnHeaders: headers})}, function (err, numberAffected) {
                if (callback) {
                    callback(err, sendHeaders);
                }
            });
        } else {
            res.status(500);
            return res.send("Error: Local domain not registered, " + localDomain)
        }
    });
}

/* HANDLE JSON ELEMENTS */

// Save json from given path or hash
exports.storeData = function(localDomain, hash, path, statusCode, headers, json, isProtected, callback) {
    Domain.findOne({localDomain: localDomain}, "_id", function(err, currentSite) {
        if (currentSite) {
            if (!hash) {
                hash = md5(path);
            }
            Data.findOne({domainId: currentSite._id, hash: hash}, function(err, results) {
                if (results) {
                    let newData = (typeof isProtected === "boolean") ? {statusCode: statusCode, headers: headers, json: json, isProtected: isProtected} : {statusCode: statusCode, headers: headers, json: json};
                    Data.update({domainId: currentSite._id, hash: hash}, {$set: newData}, function (err, numberAffected) {
                        console.log('Updated %d documents...', numberAffected.nModified, err ? err : '');
                        if (callback) {
                            callback(err, numberAffected);
                        }
                    });
                } else {
                    let newData = {domainId: currentSite._id, hash: hash, path: path, statusCode: statusCode, headers: headers, json: json, isProtected: isProtected === true};
                    Data.create(newData, function(err, data) {
                        console.log('Created new document...', err ? err : '');
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
            let fullUrl = (results.remoteDomain.startsWith("http") ? "" : protocol + '://') + results.remoteDomain + path;
            callback(fullUrl);
        } else {
            console.log(err);
            res.status(500);
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
            res.status(500);
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
            res.status(500);
            return res.send("Error: Local domain not registered, " + localDomain)
        }
    });
}
