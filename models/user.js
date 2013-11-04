var mongoose = require('mongoose'), Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },

  alias: String,

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}));
