const bodyParser = require("body-parser");
const express = require("express");
const { connectDatabase } = require("./config/mongoose");
const {adminAuthenticator} = require("./adminAuthenticator/adminAuth")
const cookieParser = require("cookie-parser");
const session = require("express-session");
const adminRoute = require("./admin/adminRoute");
const productRoute = require("./products/productRoute")
const productModel = require("./models/productModel");
const variationModel = require("./models/variationModel")


const app = express();
require("dotenv").config();

connectDatabase();

app.locals.appName = "Barb Hub"

app.set("view engine", "ejs");
app.set("views", "views")


app.use(bodyParser.urlencoded({extended: false}));
app.use(express.json());
app.use(cookieParser());
app.use("/public", express.static("public"));
app.use("/admin", adminRoute);
app.use("/products", productRoute);
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false}
}))

app.get("/", async (req, res) => {
    try {
        const cartItems = req.session.cartItems || {};
        const filter = req.query.product_state || "Published";

        const query = {
            product_state: filter
        };

        const productDetails = await productModel.find(query);

        res.status(200).render("home", {
          navs: ["Home", "Products", "Login"],
          productDetails,
          cartItems,
        });
    } catch (error) {
        console.error("Error retrieving Products:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/home", (req, res) => {
    res.redirect("/")
})

app.get("/register", (req, res) => {
    return res.render("register", {
        navs: ["Home", "Login"]
    })
});

app.get("/login", (req, res) => {
    return res.render("login", {
        navs: ["Home", "Register"]
    });
});

app.get("/dashboard", adminAuthenticator, async (req, res) => {

    const productDetails = await productModel.find({admin_id: res.locals.admin._id});

    console.log("Product details:", productDetails);

    res.status(200).render("dashboard", {
        navs: ["Dashboard", "Add Product", "Products", "Logout" ],
        admin: res.locals.admin,
        productDetails
    });
});


app.get("/addProduct", adminAuthenticator, async (req, res) => {
    res.status(200).render("addProduct", {
        navs: ["Dashboard", "Products", "Logout"],
        admin: res.locals.admin
    })
})

app.get("/edit/:id", adminAuthenticator, async (req, res) => {
    const id = req.params.id;

    try {
        const product = await productModel.findById(id);

        if (!product) {
            res.redirect("/404ErrorPage");
            return;
        }

        res.render("editProduct", {
            navs: ["Dashboard", "Products", "Logout"],
            admin: res.locals.admin,
            productToEdit: product
        })
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});


app.get("/products", async (req, res) => {
    try {
        const filter = req.query.product_state || "Published";

        const query = {
            product_state: filter
        };

        const productDetails = await productModel.find(query);

        res.status(200).render("products", {
            navs: ["Home", "Products"],
            productDetails,
        })
    } catch (error) {
        console.error("Error retrieving Products:", error);
        res.status(500).send("Internal Server Error")
    }
});

app.get("/products/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const product = await productModel.findById(id).populate('variations')

        if (!product) {
            res.redirect("/404ErrorPage");
            return
        };

        res.render("oneProduct", {
            navs: ["Home", "Products"],
            admin: res.locals.admin,
            oneProduct: product
        })
    } catch (error) {
        console.error("Error retrieving one product:", error);
        res.status(500).send(error);
    }
});

app.get("/orders", (req, res) => {
    const cartItems = req.session.cartItems || {};

    if (Object.keys(cartItems).length === 0) {
        res.status(200).render("emptyCart");
    } else {
        res.status(200).render("orders", {cartItems})
    }
})

app.post("/add-to-cart", (req, res) => {
    const {productId, price, productName, productImage, productSize = "No size", productColor = "No color"} = req.body;
    if (!productId || !price || !productName || !productImage) {
        console.error("Missing required fields:", req.body);
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const cartItems = req.session.cartItems || {};
    cartItems[productId] = {price, productName, productImage, productSize, productColor};
    req.session.cartItems = cartItems;

    res.json({success: true})
});

app.post("/remove-from-cart", (req, res) => {
    const {productId} = req.body;
    const cartItems = req.session.cartItems || {};

    delete cartItems[productId];
    req.session.cartItems = cartItems;

    res.json({ success: true });
})

app.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.redirect("/");
});

module.exports = app;