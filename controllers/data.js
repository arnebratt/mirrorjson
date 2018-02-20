let db = require('../lib/database'),
    request = require('request');
let enableExternal = true,
    includePostData = false,
    delayOnResponse = 0,
    corsAllowedUrl = "*";

// Enable or disable the use of external data (when disabled will only return data from Mongo DB)
exports.enableExternal = function(useExternal) {
    enableExternal = useExternal;
};
exports.includePostData = function(usePost) {
    includePostData = usePost;
};
exports.setDelayOnResponse = function(useDelay) {
    delayOnResponse = useDelay;
};
exports.setCorsURL = function(corsUrl) {
    corsAllowedUrl = corsUrl;
};

// Get HTTP POST parameters
let getPostBody = function(req, callback) {
    // Get body data only on POST/PUT method
    req.jsonBody = (req.method === "POST" || req.method === "PUT") ? JSON.stringify(req.body) : "";
    callback();
}

// Fetch json data from external API
let getExternalData = function(method, url, headers, sendHeaders, body, callback) {
    let options = {
        uri : url,
        method : method,
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

let sendResultJsonDelayed = function(res, headers, sendHeaders, json) {
    if (json) {
        if (!headers) {
            // Reset headers if it is undefined from database
            headers = "{}";
        }
        try {
            headers = JSON.parse(headers);
        } catch(e) {
            console.log("Failed converting header string to json", headers, e);
            res.send("Error: Header data conversion failed for :\n" + headers);
        }

        // Give access to any site for these data
        res.header("Access-Control-Allow-Origin", corsAllowedUrl);
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, TRACE, CONNECT");
        res.header("Access-Control-Allow-Credentials", "true");
        res.header("Access-Control-Allow-Headers", "Content-Type");

        sendHeaders.forEach(header => {
            header = header.toLowerCase();
            if (headers[header]) {
                res.header("Access-Control-Allow-Headers", header);
                res.header(header, headers[header]);
            }
        });

        // Convert and send body
        try {
            json = JSON.parse(json);
            // Give access to any site for these data
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, TRACE, CONNECT");
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

let sendResultJson = function(res, headers, sendHeaders, json) {
    if (delayOnResponse > 0) {
        setTimeout(function() {sendResultJsonDelayed(res, headers, sendHeaders, json);}, delayOnResponse * 1000);
    } else {
        sendResultJsonDelayed(res, headers, sendHeaders, json);
    }
}

// Get json from external API, or the mirrored data in local MongoDB database
exports.postData = function(req, res) {
    // Add HTTP POST parameters in req and possibly build path
    getPostBody(req, function() {
        let path = req.method + " " + req.originalUrl;
        if (includePostData && req.jsonBody !== "") {
            path = path + " " + req.jsonBody;
        }
        // Get the paths document from database if it exist
        db.getElement(req.get('host'), null, path, res, function(res, err, results) {
            let isProtected = (results && results.isProtected);
            console.log(path, (!enableExternal || isProtected) ? "(protected data, fetched from database)" : "");
            if (enableExternal && !isProtected) {
                // If not protected, get external url and it's data
                db.getExternalUrl(req.protocol, req.get('host'), req.originalUrl, function(url) {
                    db.updateHeadersList(req.get('host'), true, req.headers, res, function(err, sendHeaders) {
                        getExternalData(req.method, url, req.headers, sendHeaders, req.jsonBody, function(externalErr, externalResults, body) {
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
