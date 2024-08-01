const adminModel = require("../models/adminModel");
const jwt = require("jsonwebtoken");
require("dotenv").config();


const createAdmin = async ({first_name, last_name, email, password, gender}) => {
    const adminDetails = {first_name, last_name, email, password, gender};

    try {
        const existingAccount = await adminModel.findOne({})

        if (!existingAccount) {
            const adminNewAccount = await adminModel.create({
              first_name: adminDetails.first_name,
              last_name: adminDetails.last_name,
              email: adminDetails.email,
              password: adminDetails.password,
              gender: adminDetails.gender,
            });

            return {
                message: "Admin account successfully created",
                code: 200,
                adminNewAccount
            }
        } else {
            return {
                message: "Oops! Only One admin is allowed. Admin account exist already",
                code: 403,
                existingAccount,
            }
        }
    } catch (error) {
        console.error(error);
        return {
            message: "Internal Server Error",
            code: 500,
        }
    }
}


const adminLogin = async ({email, password}) => {
    const loginDetails = {email, password};

    try {
        const admin = await adminModel.findOne({email: loginDetails.email});

        if (!admin) {
            return {
                message: "Oops! Admin account not found. Only Admin can login",
                code: 404
            }
        }

        const validPassword = await admin.isValidPassword(loginDetails.password);

        if (!validPassword) {
            return {
                message: "Incorrect credential entry. Email or password is incorrect",
                code: 422
            }
        }

        const token = await jwt.sign({_id: admin._id, email: admin.email}, process.env.JWT_SECRET, {expiresIn: "1h"});

        return {
            message: "Admin login successfully",
            code: 200,
            token,
            admin
        }
    } catch (error) {
        console.error(error);
        return {
            message: "Internal Server Error",
            code: 500,
        }
    }
}


module.exports = { createAdmin, adminLogin };