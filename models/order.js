var mongoose = require('mongoose'), Schema = mongoose.Schema;

module.exports = mongoose.model('Order', new Schema({
  _user: { type: Schema.ObjectId, ref: 'User' },
  status: String,
  products: [{
    title: String,
    category: String,
    model: String,
    price: Number,
    quantity: Number
  }],
  username: String,
  phone: String,
  districts: [String],
  address: String,
  email: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}));
