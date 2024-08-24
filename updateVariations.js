const mongoose = require('mongoose');
require("dotenv").config();
const productModel = require('./models/productModel');
const variationModel = require('./models/variationModel');
const { connectDatabase } = require("./config/mongoose");

const updateNullProductIds = async () => {
  try {

    await connectDatabase();
    const variationsWithNullProductId = await variationModel.find({ product_id: null });

    if (variationsWithNullProductId.length === 0) {
      return;
    }

    for (const variation of variationsWithNullProductId) {
      const associatedProduct = await productModel.findOne({
        variations: variation._id
      });

      if (associatedProduct) {
        variation.product_id = associatedProduct._id;
        await variation.save();

        console.log(`Updated variation ${variation._id} with product_id ${associatedProduct._id}`);
      } else {
        console.log(`No product found for variation ${variation._id}`);
      }
    }
    
  } catch (error) {
    console.error('Error updating variations with null product_id:', error);
  } finally {
    mongoose.connection.close(); // close the connection when done
  }
};

updateNullProductIds();