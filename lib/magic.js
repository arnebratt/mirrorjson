let db = require('../lib/database');

let isNumber = function(value) {
    return value.match(/^\d+$/) !== null;
}

let detectIdOfPath = function(pathArray) {
    const id = pathArray.pop();
    if (!id || !isNumber(id)) {
        return 0;
    }
    const isStrings = pathArray.reduce((total, current) => {
        return total !== false && !isNumber(current);
    }, true);
    return isStrings ? parseInt(id) : 0;
}

let checkForRecords = function(host, method, pathArray, callback) {
    db.getElementMatchPath(host, method + " \/" + pathArray.join("\\/") + "\\/\\d+", null, function(err, results) {
        callback(results);
    });
}

exports.addMagic = function(host, path, input_body, output_results, callback) {
    let input, output;
    const pathElements = path.split(" ", 2);
    let method = pathElements[0];
    let pathArray = [];
    if (pathElements[1]) {
        pathArray = pathElements[1].replace(/^\/+|\/+$/g, "").split("/");
    }
    const id = detectIdOfPath(pathArray);
    if (method === "GET" && id > 0 && output_results === null) {
        checkForRecords(host, method, pathArray, function(results) {
            callback(results);
            return;
        });
        return;
    }
    if (["GET", "OPTIONS", "DELETE", "HEAD", "TRACE", "CONNECT"].indexOf(method) >= 0) {
        callback(output_results);
        return;
    }
    try {
        input = JSON.parse(input_body);
        output = JSON.parse(output_results.json);
    } catch(e) {
        callback(output_results);
        return;
    }
    if (["POST", "PUT", "PATCH"].indexOf(method) >= 0) {
        const result_json = JSON.stringify(Object.assign({}, output, input));
        output_results.json = result_json;
        db.storeData(host, null, output_results.path, output_results.statusCode, output_results.headers, output_results.json);
        callback(output_results);
        return;
    }
    callback(output_results);
}
