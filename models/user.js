var mongoose = require('mongoose'), Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
  name: String,
  phone: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}));
