var mongoose = require('mongoose'), Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
  name: String,
  phone: String,
  districts: [String],
  address: String,
  email: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  orders: [{ type: Schema.ObjectId, ref: 'Order' }]
}));
