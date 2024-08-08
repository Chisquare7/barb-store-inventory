const mongoose = require("mongoose");

const Schema = mongoose.Schema;


const productSchema = new Schema({
    name: {type: String, required: true},
    description: {type: String, required: true},
    price: {type: Number, required: true},
    product_image: {type: String, required: true},
    stock_level: {type: Number, required: true},
    product_state: {type: String, enum: ["Hidden", "Published"], default: "Hidden"},
    variations: [{type: Schema.Types.ObjectId, ref: "Variations"}],
    admin_id: {type: Schema.Types.ObjectId, ref: "Admin"}
});

const productModel = mongoose.model("Products", productSchema);

module.exports = productModel;