var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DomainSchema = new Schema({
    localDomain: {type: String, unique: true},
    remoteDomain: {type: String, index: false},
    forwardHeaders: {type: Array, index: false},
    returnHeaders: {type: Array, index: false}
}, { collection: 'mirrorjson_domain_match' });

mongoose.model('Domain', DomainSchema);
