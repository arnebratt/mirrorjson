let mongoose = require('mongoose'),
    md5 = require('md5'),
    request = require('request');

let Data = mongoose.model('Data');
let enableExternal = true;

// Enable or disable the use of external data (when disabled will only return data from Mongo DB)
exports.enableExternal = function(useExternal) {
    enableExternal = useExternal;
};

// Save json from given path to database
let storeData = function(site, path, json) {
    let hash = md5(path);
    let Domain = mongoose.model('Domain');

    Domain.findOne({localDomain: site}, "_id", function(err, currentSite) {
        if (currentSite) {
            Data.findOne({domainId: currentSite._id, hash: hash}, function(err, results) {
                if (results) {
                    Data.update({_id: results._id}, {$set: {json: json}}, function (err, numberAffected) {
                        console.log('Updated %d documents...', numberAffected.nModified, err);
                    });
                } else {
                    Data.create({domainId: currentSite._id, hash: hash, json: json}, function(err, data) {
                        console.log('Created new document...', err);
                    });
                }
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

// Get HTTP POST parameters
let getPostBody = function(req, callback) {
    let rawBody = '';
    req.on("data",function(chunk){
        rawBody += chunk.toString();
    });
    req.on("end", function() {
        let regexp = /^Content\-Disposition\: form\-data\; name\=\"(.*?)\"$/;
        let params = rawBody.split("------------------------------").map(str => {
            let lines = str.split("\r\n");
            return (lines.length > 3) ? regexp.exec(lines[1])[1] + "=" + lines[3] : '';
        }).filter(str => str);
        req.jsonBody = params.join("&");
        callback()
    });
}

// Fetch json data from external API
let postExternalData = function(url, body, callback) {
    let options = {
        uri : url,
        method : (body !== "") ? 'POST' : 'GET'
    }
    if (body !== "") {
        options.headers = {'content-type' : 'application/x-www-form-urlencoded'};
        options.body = body
    }
    request(options, callback);
}

// Get json data from database based on given path and current site
let findByHash = function(site, path, res) {
    let hash = md5(path);
    let Domain = mongoose.model('Domain');

    Domain.findOne({localDomain: site}, "_id", function(err, currentSite) {
        if (currentSite) {
            Data.findOne({domainId: currentSite._id, hash: hash}, function(err, results) {
                if (results) {
                    try {
                        return res.send(JSON.parse(results.json));
                    } catch(e) {
                        res.send("Error: json data conversion failed for :\n" + results.json);
                    }
                } else {
                    console.log(err);
                    return res.send("Error: No data found on " + path);
                }
            });
        } else {
            return res.send("Error: Local domain not registered, " + site)
        }
    });
}

// Get json from external API, or the mirrored data in local MongoDB database
exports.postData = function(req, res) {
    // Give access to any site for these data
    res.set("Access-Control-Allow-Origin", "*");

    getPostBody(req, function() {
        let path = req.originalUrl + ((req.jsonBody !== "") ? " " + req.jsonBody : "");
        if (enableExternal) {
            getExternalUrl(req, res, function(url) {
                postExternalData(url, req.jsonBody, function(err, results, body) {
                    if (results && results.statusCode === 200) {
                        try {
                            let json = JSON.parse(body);
                            storeData(req.get('host'), path, body);
                            return res.send(json);
                        } catch(e) {
                            res.send("Error: json data conversion failed for :\n" + body);
                        }
                    } else {
                        findByHash(req.get('host'), path, res);
                    }
                });
            });
        } else {
            findByHash(req.get('host'), path, res);
        }
    });
}
