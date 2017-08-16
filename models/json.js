var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var DataSchema = new Schema({
    domainId: {type: ObjectId, ref: "Domain", index: true},
    hash: {type: String, index: true},
    path: {type: String, index: false},
    post: {type: String, index: false},
    json: {type: String, index: false},
    readonly: {type: Boolean, index: false}
}, { collection: 'mirrorjson_api_data' });

mongoose.model('Data', DataSchema);
