let mongoose = require('mongoose');

let Domain = mongoose.model('Domain');

exports.updateDomainRegister = function(req, res) {
    res.send("Ok");
}