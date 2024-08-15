const mongoose = require("mongoose");

const Schema = mongoose.Schema;


const shippingInfoSchema = new Schema({
  name: { type: String, required: true },
  phone_number: { type: String, required: true },
  email: { type: String, required: true },
  delivery_address: { type: String, required: true },
  card_number: { type: String, required: true },
  month_year: { type: String, required: true },
  cvv: { type: String, required: true },
});

const shippingInfoModel = mongoose.model("ShippingInfo", shippingInfoSchema);

module.exports = shippingInfoModel;