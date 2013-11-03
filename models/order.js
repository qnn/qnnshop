var mongoose = require('mongoose'), Schema = mongoose.Schema;

module.exports = mongoose.model('Order', new Schema({
  _user: { type: Schema.ObjectId, ref: 'User' },
  status: String,
  title: String,
  category: String,
  model: String,
  price: Number,
  quantity: Number,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}));
