const express = require("express")
const middleware = require("./adminMiddleware")
const controller = require("./adminController")
const cookieParser = require("cookie-parser")

const adminRouter = express.Router();

adminRouter.use(cookieParser())


adminRouter.post("/register", middleware.validateAdminRegInfo, async (req, res) => {
    const response = await controller.createAdmin({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      password: req.body.password,
      gender: req.body.gender,
    });

    if (response.code === 200) {
        res.redirect("/login")
    } else {
        res.redirect("/existingAccount")
    }
});


adminRouter.post("/login", middleware.validateAdminLoginInfo, async (req, res) => {
    const response = await controller.adminLogin({
        email: req.body.email,
        password: req.body.password
    })

    if (response.code === 200) {
        res.cookie("jwt", response.token, {maxAge: 60 * 60 * 1000})
        res.redirect("/dashboard")
    } else if (response.code === 404) {
        res.redirect("/pageNotFound")
    } else {
        res.redirect("/invalidUserDetails")
    }
})


module.exports = adminRouter