let db = require('../lib/database'),
    handlebars = require('handlebars');

// List all domains registered in the database with elements count
let listDomains = function(req, res, status = "") {
    db.getDomains(res, function(results) {
        let currentDomain = results.find(domain => domain.localDomain === req.get('host'));
        db.getDomainElementsCount(function(countDocs) {
            res.render('domainlist', {
                results: results,
                countDocs: countDocs,
                currentLocal: req.get('host'),
                currentRemote: (currentDomain ? currentDomain.remoteDomain : undefined),
                status: status
            });
        });
    });
}

exports.adminDomainList = function(req, res) {
    if (req.body.domain) {
        db.updateDomain(req.get('host'), req.body.domain, res, function(isNew) {
            listDomains(req, res, (isNew ? "Set an" : "Updated the") + " external domain to " + req.get('host'));
        });
    } else if (req.body.remove_domain) {
        db.removeDomain(req.get('host'), res, function() {
            listDomains(req, res, "Removed the domain to " + req.get('host'));
        });
    } else {
        listDomains(req, res);
    }
}
