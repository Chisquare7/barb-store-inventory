const productModel = require("../models/productModel")
const variationModel = require("../models/variationModel");
const mongoose = require("mongoose");


const addProduct = async ({name, description, price, product_image, stock_level, product_state, variations, admin_id}) => {
    const productDetails = {name, description, price, product_image, stock_level, product_state, variations, admin_id};

    try {
        const newProduct = await productModel.create({
            name: productDetails.name,
            description: productDetails.description,
            price: productDetails.price,
            product_image: productDetails.product_image,
            stock_level: productDetails.stock_level,
            product_state: productDetails.product_state,
            variations: productDetails.variations,
            admin_id: productDetails.admin_id
        });

        return {
            message: "Great! Product added successfully",
            code: 200,
            newProduct
        }
    } catch (error) {
        console.error(error);
        return {
            message: "Oops! Internal Server Error",
            code: 500,
        }
        
    }
}


const editProduct = async (req, res) => {

    try {
        const productId = req.params.id;
        const update = req.body;

        const variations = [];
        for (let i = 0; update[`variations[${i}][size]`]; i++) {
          variations.push({
            size: update[`variations[${i}][size]`],
            color: update[`variations[${i}][color]`],
            additionalDetails: update[`variations[${i}][additionalDetails]`],
            product_id: mongoose.Types.ObjectId.createFromHexString(productId),
          });
        }

        const updatedProduct = await productModel.findByIdAndUpdate(
            productId,
            update,
            {new: true}
        );

        if (!updatedProduct) {
            return res.redirect("/dashboard")
        }

        console.log("Product successfully updated:", updatedProduct);

        if (variations.length > 0) {

            await variationModel.deleteMany({product_id: mongoose.Types.ObjectId.createFromHexString(productId)});

            const newVariations = await variationModel.insertMany(variations);

            updatedProduct.variations = newVariations.map(variation => variation._id);
            await updatedProduct.save();

        }

        res.redirect("/dashboard")
    } catch (error) {
        console.error("Error encountered during update process", error);
        res.status(500).send(error)
    }
}


const changeStatus = (req, res) => {
  const id = req.params.id;
  const update = req.body;

  productModel
    .findByIdAndUpdate(id, update, { new: true })
    .then((newStatus) => {
      res.redirect("/dashboard");
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
};


const hideProduct = async (req, res) => {
    const productId = req.params.id;

    productModel.findByIdAndUpdate(productId, {isHidden: true}, {new: true})
        .then((hiddenProduct) => {
            if (!hiddenProduct) {
                return {
                    message: "Oops! Product not found",
                    code: 404,
                }
            }

            return {
                message: "Great! Product hidden successfully",
                code: 200,
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(error);
        })
}

const showProduct = async (req, res) => {
    productModel.find({isHidden: false})
        .then((shownProduct) => {
            return {
                message: "Great! Products retrieved successfully",
                code: 200,
                shownProduct
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(error)
        })
}


module.exports = {
  addProduct,
  editProduct,
  hideProduct,
  showProduct,
  changeStatus,
};