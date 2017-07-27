var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var DataSchema = new Schema({
    domainId: {type: ObjectId, ref: "Domain", index: true},
    hash: {type: String, index: true},
    json: {type: String}
}, { collection: 'mirrorjson_api_data2' });

mongoose.model('Data', DataSchema);
