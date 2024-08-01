const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Schema = mongoose.Schema;

const adminSchema = new Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gender: { type: String, required: true },
});

adminSchema.pre("save", async function (next) {
    const hashPassword = await bcrypt.hash(this.password, 10);
    this.password = hashPassword;
    next();
});

adminSchema.methods.isValidPassword = async function (password) {
    const admin = this;
    const comparePassword = await bcrypt.compare(password, admin.password);
    return comparePassword;
}

const adminModel = mongoose.model("admin", adminSchema);

module.exports = adminModel;