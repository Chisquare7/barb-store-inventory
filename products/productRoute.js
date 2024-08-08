const express = require("express");
const cookieParser = require("cookie-parser");
const controller = require("./productControllers");
const adminModel = require("../models/adminModel");
const variationModel = require("../models/variationModel")
const { adminAuthenticator } = require("../adminAuthenticator/adminAuth");


const productRouter = express.Router();

productRouter.use(cookieParser());

productRouter.post("/add-product", adminAuthenticator, async (req, res) => {
    const admin = res.locals.admin;

    if (!admin) {
        return res.redirect("/invalidAdmin")
    }

    const { name, description, price, product_image, stock_level, ...variations } = req.body;

    const formatVariations = Object.keys(variations).reduce((accumulator, key) => {
        const match = key.match(/variations\[(\d+)\]\[(.+)\]/);
        if (match) {
            const [_, index, field] = match;
            if (!accumulator[index]) accumulator[index] = {};
            accumulator[index][field] = variations[key];
        }
        return accumulator;
    }, []).map(variation => ({
        size: parseFloat(variation.size),
        color: variation.color || "defaultColor",
        additionalDetails: variation.additionalDetails,
        product_id: null
    }));

    try {

        const savedVariations = await Promise.all(formatVariations.map(async (variation) => {
            const newVariation = new variationModel(variation);
            return await newVariation.save();
        }));

        const response = await controller.addProduct({
          name,
          description,
          price,
          product_image,
          stock_level,
          product_state: "Hidden",
          variations: savedVariations.map(variation => variation._id),
          admin_id: admin._id,
        });

        if (response.code === 200) {
          res.redirect("/dashboard");
        } else {
          res.redirect("/invalidAdmin");
        }

    } catch (error) {
        console.error("Error saving variations:", error);
        res.status(500).send({
            message: "Internal Server Error"
        })
    }
})


productRouter.post("/edit-product/:id", controller.editProduct)

productRouter.post("/updateState/:id", controller.changeStatus);

productRouter.post("/hide-product/:id", controller.hideProduct)

productRouter.post("/show-product/:id", controller.showProduct)



module.exports = productRouter