const express = require("express");
const cookieParser = require("cookie-parser");
const controller = require("./orderController");
const orderModel = require("../models/orderModel");


const orderRouter = express.Router();

orderRouter.use(cookieParser());


orderRouter.post("/add-shipping-info", controller.renderPaymentInfoPage);
orderRouter.post("/submit-payment-info", controller.addShippingInfoAndProceedToCheckout);
orderRouter.post("/confirm-order", controller.confirmOrder);
orderRouter.get("/checkout", controller.checkout);
orderRouter.get("/order-history", controller.orderHistory);
orderRouter.get("/thankyou", controller.thankYou);


module.exports = orderRouter;