var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DataSchema = new Schema({
  hash: {type: String, unique: true},
  json: {type: String}
}, { collection: 'data' });

mongoose.model('Data', DataSchema);
