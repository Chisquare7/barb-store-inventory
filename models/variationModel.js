const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const variationSchema = new Schema({
  size: { type: Number, required: true, min: 39, max: 48 },
  color: { type: String, required: true },
  additionalDetails: { type: String, required: true },
  product_id: { type: Schema.Types.ObjectId, ref: "Products", required: false },
});

const variationModel = mongoose.model("Variations", variationSchema);

module.exports = variationModel;
