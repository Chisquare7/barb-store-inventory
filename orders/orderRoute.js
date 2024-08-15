const express = require("express");
const cookieParser = require("cookie-parser");
const controller = require("./orderController");
const orderModel = require("../models/orderModel");


const orderRouter = express.Router();

orderRouter.use(cookieParser());


// orderRouter.post("/add-shipping-info", async (req, res) => {
//     const {name, phone_number, email, delivery_address, card_number, month_year, cvv} = req.body;

//     try {
//         const response = await controller.addShippingInfo({
//             name,
//             phone_number,
//             email,
//             delivery_address,
//             card_number,
//             month_year,
//             cvv,
//         });

//         if (response.code === 200) {
//             res.redirect("/checkout");
//         } else {
//             res.status(500).send(response.message)
//         }
//     } catch (error) {
//         console.error("Error saving shipping information:", error);
//         res.status(500).send("Internal Server Error")
//     }
// });


// orderRouter.post("/create-order", controller.createOrder);
orderRouter.post("/add-shipping-info", controller.renderPaymentInfoPage);
orderRouter.post("/submit-payment-info", controller.addShippingInfoAndProceedToCheckout);
orderRouter.post("/confirm-order", controller.confirmOrder);
orderRouter.get("/checkout", controller.checkout);
orderRouter.get("/order-history", controller.orderHistory);
orderRouter.get("/thankyou", controller.thankYou);


module.exports = orderRouter;