const express = require("express");
const cookieParser = require("cookie-parser");
const controller = require("./orderController");
const orderModel = require("../models/orderModel");


const orderRouter = express.Router();

orderRouter.use(cookieParser());


orderRouter.post("/add-shipping-info", controller.renderPaymentInfoPage);
orderRouter.post("/submit-payment-info", controller.addShippingInfoAndProceedToCheckout);
orderRouter.get("/checkout", controller.checkout);
orderRouter.post("/confirm-order", controller.confirmOrder);
orderRouter.get("/order-history", async (req, res) => {
    try {
        const ordersResult = await controller.orderHistory();

        if (ordersResult.code !== 200) {
            throw new Error(ordersResult.message)
        }

        res.render("orderHistory", {orders: ordersResult.orders});
    } catch (error) {
        console.error("Error rendering order history page:", error);
        res.status(500).send("An error occured while rendering the order history page.")
    }
});
orderRouter.get("/thankyou", controller.thankYou);


module.exports = orderRouter;