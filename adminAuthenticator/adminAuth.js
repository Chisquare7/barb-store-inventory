const jwt = require("jsonwebtoken");
const adminModel = require("../models/adminModel")
require("dotenv").config();

const adminAuthenticator = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      res.redirect("/login");
    }

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    const admin = await adminModel.findById(decoded._id);

    if (!admin) {
      return res.redirect("/login");
    }

    res.locals.admin = admin;

    next();
  } catch (error) {
    console.log(error.message);
    res.redirect("/login")
  }
};

module.exports = { adminAuthenticator };
