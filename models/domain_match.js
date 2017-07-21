var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DomainSchema = new Schema({
  localDomain: {type: String, unique: true},
  remoteDomain: {type: String, index: false}
}, { collection: 'mirrorjson_domain_match' });

mongoose.model('Domain', DomainSchema);
