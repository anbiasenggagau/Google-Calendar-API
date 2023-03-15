const mongoose = require("mongoose")
const validator = require("validator").default

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    require: [true, "User must have a email"],
    unique: true,
    validate: [validator.isEmail, "Invalid Emails"],
  },
  password: {
    type: String,
    require: [true, "User must have a password"],
  },
})

const User = mongoose.model("User", userSchema)

module.exports = User
