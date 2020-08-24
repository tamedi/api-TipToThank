const mongoose = require("mongoose");

const uniqueValidator = require("mongoose-unique-validator");

const Menu = new mongoose.Schema({
  dailyMenu: { picture: String, label: String },
  otherMenu: [{ picture: String, label: String, value: String }],
});
const RestaurateurSchema = new mongoose.Schema(
  {
    restaurantName: String,
    email: { type: String, unique: true },
    password: String,
    bossFirstName: String,
    bossName: String,
    adress: String,
    location: { longitude: String, latitude: String },
    phone: String,
    serviceNumber: { noon: Boolean, evening: Boolean },
    logo: String,
    picture: [],
    menu: Menu,
    qrCode: String,
    confirmed: Boolean,
    verificationId: String,
    serveur: [],
    stripeId: String,
    abonne: Boolean,
    subId: String,
  },
  {
    collection: "restaurateurs",
  }
);
RestaurateurSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Restaurateur", RestaurateurSchema);
