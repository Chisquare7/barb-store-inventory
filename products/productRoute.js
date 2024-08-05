const express = require("express");
const cookieParser = require("cookie-parser");
const controller = require("./productControllers");
const adminModel = require("../models/adminModel");
const variationModel = require("../models/variationModel")
const { adminAuthenticator } = require("../adminAuthenticator/adminAuth");


const productRouter = express.Router();

productRouter.use(cookieParser());

productRouter.post("/add-product", adminAuthenticator, async (req, res) => {
    console.log("Request body:", req.body);
    const admin = res.locals.admin;

    console.log("Admin ID:", admin._id);

    if (!admin) {
        return res.redirect("/invalidAdmin")
    }

    const { name, description, price, product_image, stock_level, ...variations } = req.body;

    const formatVariations = Object.keys(variations).reduce((accumulator, key) => {
        const match = key.match(/variations\[(\d+)\]\[(.+)\]/);
        // const [_, index, field] = key.match(/variations\[(\d+)\]\[(.+)\]/);
        if (match) {
            const [_, index, field] = match;
            if (!accumulator[index]) accumulator[index] = {};
            accumulator[index][field] = variations[key];
        }
        return accumulator;
    }, []).map(variation => ({
        size: variation.size,
        color: variation.color,
        additionalDetails: variation.additionalDetails,
        product_id: null
    }))

    // const variations = [];
    // for (const key in req.body) {
    //   if (key.startsWith("variations[")) {
    //     const match = key.match(/^variations\[(\d+)]\[(\w+)]$/);
    //     if (match) {
    //       const [, index, property] = match;
    //       if (!variations[index]) variations[index] = {};
    //       variations[index][property] = req.body[key];
    //     }
    //   }
    // }

    // const response = await controller.addProduct({
    //   name: req.body.name,
    //   description: req.body.description,
    //   price: req.body.price,
    //   product_image: req.body.product_image,
    //   stock_level: req.body.stock_level,
    //   product_state: "Hidden",
    //   variations: formatVariations,
    //   admin_id: admin._id,
    // });

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
        console.error(error);
        res.status(500).send({
            message: "Internal Server Error"
        })
    }

    // const response = await controller.addProduct({
    //   name,
    //   description,
    //   price,
    //   product_image,
    //   stock_level,
    //   product_state: "Hidden",
    //   variations: formatVariations,
    //   admin_id: admin._id,
    // });

    // console.log("Add product response:", response);

    // if (response.code === 200) {
    //     res.redirect("/dashboard");
    // } else {
    //     res.redirect("/invalidAdmin")
    // }
})


productRouter.post("/edit-product/:id", controller.editProduct)

productRouter.post("/hide-product/:id", controller.hideProduct)

productRouter.post("/show-product/:id", controller.showProduct)



module.exports = productRouter