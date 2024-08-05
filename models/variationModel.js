const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const variationSchema = new Schema({
  size: { type: String, required: false },
  color: { type: String, required: false },
  additionalDetails: { type: String, required: false },
  product_id: { type: Schema.Types.ObjectId, ref: "Products", required: false},
});

const variationModel = mongoose.model("Variations", variationSchema);

module.exports = variationModel;
