var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DomainSchema = new Schema({
    localDomain: {type: String, unique: true},
    remoteDomain: {type: String, index: false},
    forwardHeaders: {type: Object, index: false},
    returnHeaders: {type: Object, index: false},
    alias: {type: Schema.Types.ObjectId, ref: 'Domain'},
}, { collection: 'mirrorjson_domain_match' });

mongoose.model('Domain', DomainSchema);
