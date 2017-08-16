let db = require('../lib/database'),
    request = require('request');
let enableExternal = true;

// Enable or disable the use of external data (when disabled will only return data from Mongo DB)
exports.enableExternal = function(useExternal) {
    enableExternal = useExternal;
};

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
let getExternalData = function(url, body, callback) {
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

let sendResultJson = function(res, err, results) {
    try {
        return res.send(JSON.parse(results.json));
    } catch(e) {
        console.log(e);
        res.send("Error: json data conversion failed for :\n" + results.json);
    }
}

// Get json from external API, or the mirrored data in local MongoDB database
exports.postData = function(req, res) {
    // Give access to any site for these data
    res.set("Access-Control-Allow-Origin", "*");

    getPostBody(req, function() {
        let path = req.originalUrl + ((req.jsonBody !== "") ? " " + req.jsonBody : "");
        if (enableExternal) {
            db.getExternalUrl(req.protocol, req.get('host'), req.originalUrl, function(url) {
                getExternalData(url, req.jsonBody, function(err, results, body) {
                    if (results && results.statusCode === 200) {
                        try {
                            let json = JSON.parse(body);
                            db.storeData(req.get('host'), null, path, body);
                            return res.send(json);
                        } catch(e) {
                            console.log(e);
                            res.send("Error: json data conversion failed for :\n" + body);
                        }
                    } else {
                        db.getElement(req.get('host'), null, path, res, sendResultJson);
                    }
                });
            });
        } else {
            db.getElement(req.get('host'), null, path, res, sendResultJson);
        }
    });
}
