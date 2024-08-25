const orderModel = require("../models/orderModel");
const shippingInfoModel = require("../models/shippingInfoModel");
const productModel = require("../models/productModel");

const renderPaymentInfoPage = (req, res) => {
    const {cartItems, totalAmount} = req.body;
    res.render("paymentInfo", {cartItems, totalAmount});
}


const addShippingInfoAndProceedToCheckout = async (req, res) => {
    try {
        const {
          name,
          phone_number,
          email,
          delivery_address,
          card_number,
          month_year,
          cvv,
          cartItems,
          totalAmount
        } = req.body;

        const newShippingInfo = await shippingInfoModel.create({
            name,
            phone_number,
            email,
            delivery_address,
            card_number,
            month_year,
            cvv
        })

        req.session.shippingInfo = newShippingInfo;
        req.session.cartItems = JSON.parse(cartItems);
        req.session.totalAmount = totalAmount;

        res.redirect("/orders/checkout");
    } catch (error) {
        console.error("Error adding shipping info:", error);
        res.status(500).send("An error occurred while saving shipping information.")
    }
}


const checkout =  async (req, res) => {
    try {
        const cartItems = typeof req.session.cartItems === 'string' ? JSON.parse(req.session.cartItems):req.session.cartItems;
        const shippingInfo = req.session.shippingInfo;
        let totalAmount = 0;

        if (cartItems) {
          Object.keys(cartItems).forEach((key) => {
            let item = cartItems[key];
            totalAmount += item.quantity * item.price;
          });
        }

        req.session.totalAmount = totalAmount;

        if (!shippingInfo || Object.keys(cartItems).length === 0 || totalAmount === 0) {
            return res.status(404).send("Required information is missing from the session.")
        }

        res.render("checkout", {shippingInfo, cartItems, totalAmount})

    } catch (error) {
        console.error("Error during checkout:", error);
        res.status(500).send("An error occured during checkout")
    }
}


const confirmOrder = async (req, res) => {
    try {
        const shippingInfo = req.session.shippingInfo;
        const cartItems = req.session.cartItems;
        const totalAmount = req.session.totalAmount;

        if (!shippingInfo || !cartItems || !totalAmount) {
            return res.status(404).send("Required information not found")
        }

        const newOrder = new orderModel({
            cartItems,
            totalAmount,
            shippingInfo: shippingInfo._id,
            status: "Confirmed"
        });

        await newOrder.save();

        for (const item of req.session.cartItems) {
            const product = await productModel.findById(item.productId);

            if (product) {
                product.stock_level -= item.quantity;

                if (product.stock_level < 10) {
                    console.log(`Important Alert: Stock for ${product.name} is low`);
                }

                await product.save();
            }
        }

        return {
            code: 200,
            message: "Order confirmed"
        }
    } catch (error) {
        console.error("Error confirming order:", error);
        res.status(500).send("Error confirming order")
    }
}

const thankYou = (req, res) => {

    req.session.cartItems = null;
    req.session.totalAmount = null;
    req.session.shippingInfo = null;

    res.render("thankYou")
}

const orderHistory = async () => {
    try {
        const orders = await orderModel.find({}).populate("shippingInfo");

        if (!orders || orders.length === 0) {
            throw new Error("No orders found")
        }

        orders.forEach(order => {
            if (!order._id) {
                throw new Error("Order_id os missing")
            }
        })
        
        return {
            message: "Great! Orders retrieved successfully",
            code: 200,
            orders
        }
    } catch (error) {
        console.error(error);
        return {
            message: "Oops! Internal Server Error",
            code: 500
        }
    }    
}


module.exports = {
    renderPaymentInfoPage,
    addShippingInfoAndProceedToCheckout,
    confirmOrder,
    orderHistory,
    checkout,
    thankYou,
};