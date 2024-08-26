const bodyParser = require("body-parser");
const express = require("express");
const { connectDatabase } = require("./config/mongoose");
const { adminAuthenticator } = require("./adminAuthenticator/adminAuth");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const adminRoute = require("./admin/adminRoute");
const productRoute = require("./products/productRoute");
const orderRoute = require("./orders/orderRoute");
const orderController = require("./orders/orderController")
const productModel = require("./models/productModel");
const variationModel = require("./models/variationModel");
const shippingInfoModel = require("./models/shippingInfoModel");
const orderModel = require("./models/orderModel");

const app = express();
require("dotenv").config();

connectDatabase();

app.locals.appName = "Barb Hub";

app.set("view engine", "ejs");
app.set("views", "views");


const store = new MongoDBStore({
  uri: process.env.DB_URL,
  collection: "sessions",
});

store.on("error", function (error) {
  console.error("Session store error:", error);
});

app.use(
  session({
    store: store,
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 60000 * 60 },
  })
);

app.use((req, res, next) => {
  if (!req.session.logged) {
    req.session.logged = true;
  }
  next();
});

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/public", express.static("public"));
app.use("/admin", adminRoute);
app.use("/products", productRoute);
app.use("/orders", orderRoute);


app.use(function (req, res, next) {
  res.setHeader(
    "Content-Security-Policy-Report-Only",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://code.jquery.com https://cdnjs.cloudflare.com https://stackpath.bootstrapcdn.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://stackpath.bootstrapcdn.com https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; img-src 'self' https://i.ibb.co; frame-src 'self'"
  );

  next();
});

app.get("/", async (req, res) => {
  try {
    const cartItems = req.session.cartItems || {};
    const filter = req.query.product_state || "Published";

    const query = {
      product_state: filter,
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
  res.redirect("/");
});

app.get("/register", (req, res) => {
  return res.render("register", {
    navs: ["Home", "Login"],
  });
});

app.get("/login", (req, res) => {
  return res.render("login", {
    navs: ["Home", "Register"],
  });
});

app.get("/dashboard", adminAuthenticator, async (req, res) => {
  const productDetails = await productModel.find({
    admin_id: res.locals.admin._id,
  });

  res.status(200).render("dashboard", {
    navs: ["Dashboard", "Add Product", "Products", "Logout"],
    admin: res.locals.admin,
    productDetails,
  });
});

app.get("/addProduct", adminAuthenticator, async (req, res) => {
  res.status(200).render("addProduct", {
    navs: ["Dashboard", "Products", "Logout"],
    admin: res.locals.admin,
  });
});

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
      productToEdit: product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.get("/products", async (req, res) => {
  try {
    const cartItems = req.session.cartItems || {};
    const filter = req.query.product_state || "Published";

    const query = {
      product_state: filter,
    };

    const productDetails = await productModel.find(query);

    res.status(200).render("products", {
      navs: ["Home", "Products"],
      productDetails,
      cartItems,
    });
  } catch (error) {
    console.error("Error retrieving Products:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/products/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const cartItems = req.session.cartItems || {};
    const product = await productModel.findById(id).populate("variations");

    if (!product) {
      res.redirect("/404ErrorPage");
      return;
    }

    res.render("oneProduct", {
      navs: ["Home", "Products"],
      admin: res.locals.admin,
      oneProduct: product,
      cartItems,
    });
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
    const totalAmount = Object.values(cartItems).reduce((total, item) => {
      return total + (parseFloat(item.price) * parseInt(item.quantity))
    }, 0).toFixed(2);
    res.status(200).render("orders", { cartItems, totalAmount });
  }
});

app.post("/orders", (req, res) => {
  const {product_id, quantity, price, size, color} = req.body;

  if (!req.session.cartItems) {
    req.session.cartItems = {};
  }

  if (req.session.cartItems[product_id]) {
    req.session.cartItems[product_id].quantity += parseInt(quantity);
  } else {
    req.session.cartItems[product_id] = {
      product_id,
      price: parseFloat(price).toFixed(2),
      size,
      color,
      quantity: parseInt(quantity),
    };
  }

  res.redirect("/orders");
})


app.get("/cart-items", (req, res) => {
  const cartItems = req.session.cartItems || {};
  res.json({ success: true, cartItems });
});


app.post("/add-to-cart", (req, res) => {
  const {
    productId,
    price,
    productName,
    productImage,
    productSize = "No size",
    productColor = "No color",
    quantity = 1,
  } = req.body;
  if (!productId || !price || !productName || !productImage) {
    console.error("Missing required fields:", req.body);
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  const cartItems = req.session.cartItems || {};
  if (!cartItems[productId]) {
    cartItems[productId] = {
      price: parseFloat(price),
      productName,
      productImage,
      productSize,
      productColor,
      quantity: parseInt(quantity)
    };
  } else {
    cartItems[productId].quantity += parseInt(quantity);
  }
  req.session.cartItems = cartItems;

  res.json({ success: true, cartItems });
});

app.post("/remove-from-cart", (req, res) => {
  const { productId } = req.body;
  const cartItems = req.session.cartItems || {};

  if (cartItems[productId]) {
    cartItems[productId].quantity = (cartItems[productId].quantity || 0) - 1;
    
    if (cartItems[productId].quantity <= 0) {
      delete cartItems[productId];
    }
  }
  req.session.cartItems = cartItems;

  res.json({ success: true, cartItems });
});





app.post("/confirm-order", async (req, res) => {
  try {
    const response = await orderController.confirmOrder(req, res);

    if (response.code === 200) {
      res.redirect("/thankyou");
    } else {
      res.status(response.code).send(response.message);
    }
  } catch (error) {
    console.error("Error confirming order:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/checkout", async (req, res) => {
  try {
    const cartItems = req.session.cartItems || {};
    const shippingInfo = req.session.shippingInfo;
    const totalAmount = req.session.totalAmount;

    res.render("checkout", {
      cartItems,
      shippingInfo,
      totalAmount
    })
  } catch (error) {
    console.error("Error rendering checkout page:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.get("/thankyou", (req, res) => {
  res.render("thankYou");
});


app.get("/order-history", async (req, res) => {
  try {

    const orders = await orderModel.find({});

    res.render("orderHistory", {
      orders
    });

  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(500).send("Internal Server Error");
  }
})


app.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.redirect("/");
});

module.exports = app;
