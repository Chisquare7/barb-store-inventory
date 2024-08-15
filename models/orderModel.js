const mongoose = require("mongoose");

const Schema = mongoose.Schema;


const orderSchema = new Schema({
  cartItems: [{ type: Object, required: true }],
  totalAmount: { type: Number, required: true },
  shippingInfo: { type: Schema.Types.ObjectId, ref: "ShippingInfo", required: true },
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

const orderModel = mongoose.model("Orders", orderSchema);

module.exports = orderModel;