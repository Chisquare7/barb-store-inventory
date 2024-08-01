const mongoose = require("mongoose");
require("dotenv").config();


function connectDatabase() {
    mongoose.connect(process.env.DB_URL)

    mongoose.connection.on("connected", () => {
        console.log("Database connected successfully");
    });

    mongoose.connection.on("error", (error) => {
        console.log("Failed to connect to database", error)
    })
}


module.exports = {connectDatabase};