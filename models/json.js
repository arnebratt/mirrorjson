var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DataSchema = new Schema({
    site: {type: String, index: true},
    hash: {type: String, index: true},
    json: {type: String}
}, { collection: 'mirrorjson_api_data' });

mongoose.model('Data', DataSchema);
