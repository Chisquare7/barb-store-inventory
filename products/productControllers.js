const productModel = require("../models/productModel")
const variationModel = require("../models/variationModel");


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
            variations: productDetails.variations || [],
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
    const productId = req.params.id;
    const update = req.body;

    productModel.findByIdAndUpdate(productId, update, {new: true})
        .then((updatedProduct) => {
            if (!updatedProduct) {
                return res.redirect("/dashboard")
            }

            if (update.variations) {
                return variationModel.deleteMany({product_id: productId})
                    .then(() => {
                        const variations = update.variations.map(variation => ({...variation, productId}))
                        return variationModel.insertMany(variations)
                    })
            }
        }).then(() => {
            res.redirect("/dashboard")
        })
        .catch((error) => {
            console.log(error)
            res.status(500).send(error)
        })
}


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
};