const orderModel = require("../models/orderModel");
const shippingInfoModel = require("../models/shippingInfoModel");
const productModel = require("../models/productModel")


// const createOrder = async (req, res) => {
//     try {
//         const {cartItems, totalAmount} = req.body;

//         if (!cartItems || !totalAmount) {
//             return res.status(400).json({
//                 error: "Missing required fields"
//             })
//         }

//         const newOrder = new orderModel({
//             cartItems: JSON.parse(cartItems),
//             totalAmount,
//             status: "Pending"
//         })

//         const savedOrder = await newOrder.save();

//         req.session.orderId = savedOrder._id;

//         console.log("Created Order ID:", savedOrder._id);

//         res.status(200).json(savedOrder);
//     } catch (error) {
//         console.error("Error creating order:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// }

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
        const cartItemsString = req.session.cartItems || '{}';
        const cartItems = JSON.parse(cartItemsString);
        // const cartItems = req.session.cartItems;
        const shippingInfo = req.session.shippingInfo;
        let totalAmount = req.session.totalAmount;

        console.log("Cart Items:", JSON.stringify(cartItems, null, 2));

        if (typeof totalAmount === "string") {
            totalAmount = parseFloat(totalAmount);
        }

        if (!shippingInfo || Object.keys(cartItems).length === 0 || !totalAmount) {
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
        // const shippingInfo = await shippingInfoModel.findById(req.body.shippingInfoId);

        if (!shippingInfo || !cartItems || !totalAmount) {
            return res.status(404).send("Required information not found")
        }

        const newOrder = new orderModel({
            cartItems,
            totalAmount,
            shippingInfoId: shippingInfo._id,
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

        req.session.cartItems = null;
        req.session.totalAmount = null;
        req.session.shippingInfo = null;

        res.redirect("/thankyou")
    } catch (error) {
        console.error("Error confirming order:", error);
        res.status(500).send("Error confirming order")
    }
}

const thankYou = async (req, res) => {
    res.render("thankYou")
}

const orderHistory = async (user_id) => {
    try {
        const orders = await orderModel.find({user_id}).populate("shippingInfo");
        
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