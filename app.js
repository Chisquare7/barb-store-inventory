const bodyParser = require("body-parser");
const express = require("express");
const { connectDatabase } = require("./config/mongoose");
const {adminAuthenticator} = require("./adminAuthenticator/adminAuth")
const cookieParser = require("cookie-parser");
const adminRoute = require("./admin/adminRoute");
const productRoute = require("./products/productRoute")
const productModel = require("./models/productModel");


const app = express();

connectDatabase();

app.locals.appName = "Barb Shoe Hub"

app.set("view engine", "ejs");
app.set("views", "views")


app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser())
app.use("/public", express.static("public"));
app.use("/admin", adminRoute);
app.use("/products", productRoute);


app.get("/", (req, res) => {
    res.status(200).render("home", {
        navs: ["Home", "Products", "Register", "Login"]
    })
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
})

module.exports = app;