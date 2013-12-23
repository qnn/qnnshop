var mongoose = require('mongoose'), Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },

  banned: { type: Boolean, default: false }, // set by admin, disallow user to log in or not
  force_log_out: { type: Boolean, default: false }, // set by admin, whether user should log out now

  alias: String,

  defaults: {
    name: String,
    phone: String,
    districts: [String],
    address: String,
    email: String
  },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  last_logged_in_at: [{ type: Date, default: Date.now }],
  password_updated_at: { type: Date, default: Date.now }
}));
