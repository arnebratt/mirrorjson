let mongoose = require('mongoose'),
    md5 = require('md5'),
    request = require('request');

let Data = mongoose.model('Data');

// Save json from given path to database
let storeData = function(site, path, json) {
    let hash = md5(path);

    Data.findOne({site: site, hash: hash}, function(err, results) {
        if (results) {
            Data.update({_id: results._id}, {$set: {json: json}}, function (err, numberAffected) {
                console.log('Updated %d documents...', numberAffected.nModified, err);
            });
        } else {
            Data.create({site: site, hash: hash, json: json}, function(err, data) {
                console.log('Created new document...', err);
            });
        }
    });
}
exports.storeData = storeData;

// Generate external url based on current domain
let getExternalUrl = function(req, res, callback) {
    let Domain = mongoose.model('Domain');

    Domain.findOne({localDomain: req.get('host')}, function(err, results) {
        if (results) {
            let fullUrl = req.protocol + '://' + results.remoteDomain + req.originalUrl;
            callback(fullUrl);
        } else {
            console.log(err);
            return res.send("Error: Remote domain not found on " + req.get('host'));
        }
    });
}

// Fetch json data from external API
let getExternalData = function(url, callback) {
    let options = {
        uri : url,
        method : 'GET'
    };
    request(options, callback);
}

// Get json data from database based on given path and current site
let findByHash = function(site, path, res) {
    let hash = md5(path);

    Data.findOne({site: site, hash: hash}, function(err, results) {
        if (results) {
            return res.send(JSON.parse(results.json));
        } else {
            console.log(err);
            return res.send("Error: No data found on " + path);
        }
    });
}

// Get json from external API, or the mirrored data in local MongoDB database
exports.getData = function(req, res) {
    // Give access to any site for these data
    res.set("Access-Control-Allow-Origin", "*");

    getExternalUrl(req, res, function(url) {
        getExternalData(url, function(err, results, body) {
            if (results && results.statusCode === 200) {
                storeData(req.get('host'), req.originalUrl, body);
                return res.send(JSON.parse(body));
            } else {
                findByHash(req.get('host'), req.originalUrl, res);
            }
        });
    });
}
