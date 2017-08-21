let db = require('../lib/database'),
    request = require('request');
let enableExternal = true
    forwardHeaders = ['set-cookie', 'cookie'],
    returnHeaders = ['server', 'served-by', 'expires', 'cache-control', 'pragma', 'x-powered-by', 'content-language', 'content-type', 'set-cookie', 'last-modified', 'transfer-encoding', 'date'];

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
let getExternalData = function(url, headers, body, callback) {
    let options = {
        uri : url,
        method : (body !== "") ? 'POST' : 'GET',
        headers: {}
    }
    forwardHeaders.forEach(value => {
        value = value.toLowerCase();
        if (headers[value]) {
            options.headers[value] = headers[value];
        }
    });
    if (body !== "") {
        options.body = body
    }

    request(options, callback);
}

let sendResultJson = function(res, err, headers, json) {
    if (json) {
        try {
            headers = JSON.parse(headers);
            json = JSON.parse(json);
            returnHeaders.forEach(value => {
                value = value.toLowerCase();
                if (headers[value]) {
                    res.header(value, headers[value]);
                }
            });
            return res.json(json);
        } catch(e) {
            console.log(e);
            res.send("Error: json data conversion failed for :\n" + json);
        }
    } else {
        return res.send("Error: Requested data not found");
    }
}

// Get json from external API, or the mirrored data in local MongoDB database
exports.postData = function(req, res) {
    // Give access to any site for these data
    res.header("Access-Control-Allow-Origin", "*");

    getPostBody(req, function() {
        let path = req.originalUrl + ((req.jsonBody !== "") ? " " + req.jsonBody : "");
        db.getElement(req.get('host'), null, path, res, function(res, err, results) {
            let isProtected = (results && results.isProtected);
            if (enableExternal && !isProtected) {
                db.getExternalUrl(req.protocol, req.get('host'), req.originalUrl, function(url) {
                    getExternalData(url, req.headers, req.jsonBody, function(externalErr, externalResults, body) {
                        if (externalResults && externalResults.statusCode === 200) {
                            let headers = (externalResults) ? JSON.stringify(externalResults.headers) : "";
                            db.storeData(req.get('host'), null, path, headers, body);
                            sendResultJson(res, err, headers, body);
                        } else {
                            sendResultJson(res, err, (results) ? results.headers : "", (results) ? results.json : "");
                        }
                    });
                });
            } else {
                sendResultJson(res, err, (results) ? results.headers : "", (results) ? results.json : "");
            }
        });
    });
}
