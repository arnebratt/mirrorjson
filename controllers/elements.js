let mongoose = require('mongoose');
let handlebars = require('handlebars');

let Domain = mongoose.model('Domain');
let Data = mongoose.model('Data');

let elementsListTpl = require('../templates/elementslist.handlebars');

// List all elements registered in the database for the selected domain
let listElements = function(req, res, status = "") {
    Domain.findOne({localDomain: req.params.domain}, "_id", function(err, currentSite) {
        if (currentSite) {
            Data.find({domainId: currentSite._id}, function(err, results) {
                let list = results.map(json => {return {
                    hash: json.hash,
                    json: json.json.substring(0, 300) + (json.json.length > 300 ? "...+" + (json.json.length - 300) : "")
                };});
                let template = handlebars.compile(elementsListTpl.tpl());
                res.send(template({results: list, selectedDomain: req.params.domain, status: status}));
            });
        } else {
            return res.send("Error: Local domain not registered, " + site)
        }
    });
}

exports.adminElementsList = function(req, res) {
    listElements(req, res);
}
