let mongoose = require('mongoose'),
	md5 = require('md5'),
	request = require('request');

let Data = mongoose.model('Data');

let getExternalUrl = function(req) {
    return "http://www.godfisk.no/api/nsc/v2/tags";
}

let getExternalData = function(url, callback) {
    let options = {
        uri : url,
        method : 'GET'
    };
    request(options, callback);
}

let findByHash = function(url, res) {
	let hash = md5(url);

    Data.findOne({hash: hash}, function(err, results) {
        if (results) {
    	    return res.send(JSON.parse(results.json));
	    } else {
	        console.log(err);
    	    return res.send("Error: No data found on " + url);
	    }
    });
}

exports.getData = function(req, res) {
    let url = getExternalUrl(req);
    getExternalData(url, function(err, results) {
        if (results && results.statusCode === 200) {
    	    return res.send(results);
	    } else {
            findByHash(req.originalUrl, res);
	    }
    });
}
