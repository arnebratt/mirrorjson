let mongoose = require('mongoose'),
	md5 = require('md5');

let Data = mongoose.model('Data');

exports.findByHash = function(req, res) {
	let hash = md5(req.originalUrl);
	console.log(hash);

    Data.findOne({hash: hash}, function(err, results) {
    	return res.send(results);
    });
}
