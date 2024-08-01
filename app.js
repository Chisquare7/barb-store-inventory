const bodyParser = require("body-parser");
const express = require("express");
const { connectDatabase } = require("./config/mongoose");
const cookieParser = require("cookie-parser");
const adminRoute = require("./admin/adminRoute");


const app = express();

connectDatabase();

app.set("view engine", "ejs");
app.set("views", "views")


app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser())
app.use("/public", express.static("public"));
app.use("/admin", adminRoute)


app.get("/", (req, res) => {
    res.status(200).render("home", {
        navs: ["Home", "Products", "Register", "Login"]
    })
});

app.get("/register", (req, res) => {
    return res.render("register", {
        navs: ["Home", "Login"]
    })
});

app.get("/login", (req, res) => {
    return res.render("login", {
        navs: ["Home", "Register"]
    })
})


module.exports = app;