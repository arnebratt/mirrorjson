let mongoose = require('mongoose'),
	md5 = require('md5'),
	request = require('request');

let Data = mongoose.model('Data');

let storeData = function(path, json) {
	let hash = md5(path);

    Data.findOne({hash: hash}, function(err, results) {
        if (results) {
            Data.update({_id: results._id}, {$set: {json: json}}, function (err, numberAffected) {
                console.log('Updated %d documents...', numberAffected, err);
            });
        } else {
            Data.create({hash: hash, json: json}, function(err, data) {
                console.log('Created new document...', err);
            });
        }
    });
}

let getExternalUrl = function(req, res, callback) {
    let Domain = mongoose.model('Domain');

    Domain.findOne({localDomain: req.get('host')}, function(err, results) {
        if (results) {
            let fullUrl = req.protocol + '://' + results.remoteDomain + req.originalUrl;
    	    callback(fullUrl);
	    } else {
	        console.log(err);
    	    return res.send("Error: Remote domain not found on " + urlElements[2]);
	    }
    });
}

let getExternalData = function(url, callback) {
    let options = {
        uri : url,
        method : 'GET'
    };
    request(options, callback);
}

let findByHash = function(path, res) {
	let hash = md5(path);

    Data.findOne({hash: hash}, function(err, results) {
        if (results) {
    	    return res.send(JSON.parse(results.json));
	    } else {
	        console.log(err);
    	    return res.send("Error: No data found on " + path);
	    }
    });
}

exports.getData = function(req, res) {
    getExternalUrl(req, res, function(url) {
        getExternalData(url, function(err, results, body) {
            if (results && results.statusCode === 200) {
                storeData(req.originalUrl, body);
        	    return res.send(JSON.parse(body));
    	    } else {
                findByHash(req.originalUrl, res);
    	    }
        });
    });
}
