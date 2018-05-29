let mongoose = require('mongoose'),
    md5 = require('md5');

let Domain = mongoose.model('Domain');
let Data = mongoose.model('Data');

/* HANDLE DOMAINS */


let _getCurrentDomain = function(localDomain, res, callback) {
    Domain.findOne({localDomain: localDomain}, function(err, currentSite) {
        if (!err) {
            callback(currentSite.alias ? currentSite.alias : currentSite);
        } else if (res) {
            res.status(500);
            return res.send("Error: Local domain not registered, " + localDomain);
        }
    }).populate("alias");
}
exports.getCurrentDomain = _getCurrentDomain;

exports.getDomains = function(res, callback) {
    Domain.find({}, function(err, results) {
        if (results) {
            callback(results.filter(domain => (domain.remoteDomain)));
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

exports.getDomainAliases = function(localDomain, callback) {
    _getCurrentDomain(localDomain, null, function(currentSite) {
        Domain.find({alias: currentSite._id}, function(err, aliases) {
            callback(aliases ? aliases : []);
        });
    });
}

exports.updateDomain = function(localDomain, remoteDomain, aliasId, res, callback) {
    Domain.findOne({localDomain: localDomain}, function(err, currentSite) {
        if (currentSite) {
            Domain.update({localDomain: localDomain}, {$set: {remoteDomain: remoteDomain, alias: aliasId}}, function (err, numberAffected) {
                if (!err) {
                    // Delete documents only if main domain is modified
                    if (remoteDomain) {
                        Data.deleteMany({domainId: currentSite._id}, function (err, dataResult) {
                            console.log(dataResult ? (dataResult.deletedCount + " documents related to '" + currentSite.remoteDomain + "' deleted.") : err);
                            callback();
                        })
                    } else {
                        callback();
                    }
                } else {
                    console.log(err);
                    res.status(500);
                    return res.send("Error: Failed updating domain reference for " + localDomain);
                }
            });
        } else {
            Domain.create({localDomain: localDomain, remoteDomain: remoteDomain, alias: aliasId}, function (err, domain) {
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
    _getCurrentDomain(localDomain, null, function(currentSite) {
        Domain.remove({localDomain: localDomain}, function (err, writeOpResult) {
            if (!err) {
                Data.deleteMany({domainId: currentSite._id}, function (err, dataResult) {
                    console.log(dataResult ? (dataResult.deletedCount + " documents related to '" + currentSite.remoteDomain + "' deleted.") : err);
                    callback();
                })
            } else {
                console.log(err);
                res.status(500);
                return res.send("Error: Failed removing domain reference for " + localDomain);
            }
        });
    });
}

/* HANDLE HEADERS */

// Return a list of current headers on specified domain
exports.getHeadersList = function(localDomain, getForwardHeaders, res, callback) {
    _getCurrentDomain(localDomain, res, function(currentSite) {
        callback(res, err, (getForwardHeaders) ? currentSite.forwardHeaders : currentSite.returnHeaders);
    });
};

// Update headers for current domain, and return headers that have been selected to pass on
// newHeaders: object of header fields, if field is boolean will update database
// sendHeaders: return array with headers that should be passed on to either external API or frontend
exports.updateHeadersList = function(localDomain, setForwardHeaders, newHeaders, res, callback) {
    _getCurrentDomain(localDomain, res, function(currentSite) {
        let headers = (setForwardHeaders ? currentSite.forwardHeaders : currentSite.returnHeaders) || {};
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
    });
}

/* HANDLE JSON ELEMENTS */

// Save json from given path or hash
exports.storeData = function(localDomain, hash, path, statusCode, headers, json, isProtected, res, callback) {
    _getCurrentDomain(localDomain, res, function(currentSite) {
        if (!hash) {
            hash = md5(path);
        }
        Data.findOne({domainId: currentSite._id, hash: hash}, function(err, results) {
            if (results) {
                let newData = (typeof isProtected === "boolean") ?
                    {statusCode: statusCode, headers: headers, json: json, isProtected: isProtected, lastAccessed: Date.now()}
                    : {statusCode: statusCode, headers: headers, json: json, lastAccessed: Date.now()};
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
    });
}

// Generate external url based on current domain
exports.getExternalUrl = function(protocol, localDomain, path, res, callback) {
    _getCurrentDomain(localDomain, res, function(currentSite) {
        if (currentSite) {
            let fullUrl = (currentSite.remoteDomain.startsWith("http") ? "" : protocol + '://') + currentSite.remoteDomain + path;
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
    _getCurrentDomain(localDomain, res, function(currentSite) {
        if (!hash) {
            hash = md5(path);
        }
        Data.findOne({domainId: currentSite._id, hash: hash}, function(err, results) {
            let newData = {lastAccessed: Date.now()};
            Data.update({domainId: currentSite._id, hash: hash}, {$set: newData}, function(err, raw) {});
            callback(res, err, results);
        });
    });
}

// Get all elements in selected site
exports.getSiteElements = function(localDomain, res, callback) {
    _getCurrentDomain(localDomain, res, function(currentSite) {
        Data.find({domainId: currentSite._id}, function(err, results) {
            callback(err, results);
        }).sort({lastAccessed: 'descending'});
    });
}
