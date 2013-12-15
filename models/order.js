var mongoose = require('mongoose'), Schema = mongoose.Schema;

module.exports = mongoose.model('Order', new Schema({
  _user: { type: Schema.ObjectId, ref: 'User' },
  id_str: String, // same as _id, but searchable
  status: String,
  payment: String,
  payment_details: String,
  products: [{
    title: String,
    category: String,
    model: String,
    price: Number,
    quantity: Number
  }],
  final_price: { type: Number, default: -1 },
  buyer_comments: String,
  seller_comments: String,
  username: String,
  phone: String,
  districts: [String],
  address: String,
  email: String,
  invoice: String,
  shipping: {
    by: String,
    number: String,
    at: { type: Date, default: 0 }
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}));
