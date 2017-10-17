let db = require('../lib/database'),
    request = require('request');
let enableExternal = true;

// Enable or disable the use of external data (when disabled will only return data from Mongo DB)
exports.enableExternal = function(useExternal) {
    enableExternal = useExternal;
};

// Get HTTP POST parameters
let getPostBody = function(req, callback) {
    // Get body data only on POST method
    if (req.method !== "POST") {
        req.jsonBody = "";
        callback();
        return;
    }
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
        callback();
    });
}

// Fetch json data from external API
let getExternalData = function(url, headers, sendHeaders, body, callback) {
    let options = {
        uri : url,
        method : (body !== "") ? 'POST' : 'GET',
        headers: {}
    }
    sendHeaders.forEach(header => {
        header = header.toLowerCase();
        if (headers[header]) {
            options.headers[header] = headers[header];
        }
    });
    if (body !== "") {
        options.body = body
    }

    request(options, callback);
}

let sendResultJson = function(res, headers, sendHeaders, json) {
    if (json) {
        if (!headers) {
            // Reset headers if it is undefined from database
            headers = "{}";
        }
        try {
            headers = JSON.parse(headers);
            json = JSON.parse(json);
            // Give access to any site for these data
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.header("Access-Control-Allow-Credentials", "true");
            res.header("Access-Control-Allow-Headers", "Content-Type");

            sendHeaders.forEach(header => {
                header = header.toLowerCase();
                if (headers[header]) {
                    res.header("Access-Control-Allow-Headers", header);
                    res.header(header, headers[header]);
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
    // Add HTTP POST parameters in req and build path
    getPostBody(req, function() {
        let path = req.method + " " + req.originalUrl + ((req.jsonBody !== "") ? " " + req.jsonBody : "");
        // Get the paths document from database if it exist
        db.getElement(req.get('host'), null, path, res, function(res, err, results) {
            let isProtected = (results && results.isProtected);
            console.log(path, (!enableExternal || isProtected) ? "(protected data, fetched from database)" : "");
            if (enableExternal && !isProtected) {
                // If not protected, get external url and it's data
                db.getExternalUrl(req.protocol, req.get('host'), req.originalUrl, function(url) {
                    db.updateHeadersList(req.get('host'), true, req.headers, res, function(err, sendHeaders) {
                        getExternalData(url, req.headers, sendHeaders, req.jsonBody, function(externalErr, externalResults, body) {
                            if (externalResults && externalResults.statusCode === 200) {
                                // Save data in database and pass back to frontend
                                let headers = (externalResults) ? JSON.stringify(externalResults.headers) : "";
                                db.storeData(req.get('host'), null, path, headers, body);
                                db.updateHeadersList(req.get('host'), false, (externalResults) ? externalResults.headers : {}, res, function(err, sendHeaders) {
                                    sendResultJson(res, headers, sendHeaders, body);
                                });
                            } else {
                                // Return data from database if possible
                                db.updateHeadersList(req.get('host'), false, {}, res, function(err, sendHeaders) {
                                    sendResultJson(res, (results) ? results.headers : "", sendHeaders, (results) ? results.json : "");
                                });
                            }
                        });
                    });
                });
            } else {
                // Return data from database if possible
                db.updateHeadersList(req.get('host'), false, {}, res, function(err, sendHeaders) {
                    sendResultJson(res, (results) ? results.headers : "", sendHeaders, (results) ? results.json : "");
                });
            }
        });
    });
}
