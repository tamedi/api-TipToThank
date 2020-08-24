const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const historySchema = new mongoose.Schema({
  date: Date,
  amount: Number,
});
const serveurSchema = new mongoose.Schema(
  {
    lastname: String,
    firstname: String,
    email: { type: String, unique: true },
    password: String,
    date: String,
    adress: String,
    city: String,
    phone: String,
    staff: String,
    picture: String,
    iban: String,
    id: String,
    restaurantName: { _id: String, name: String },
    verificationIdAffiliation: String,
    confirmed: Boolean,
    verificationId: String,
    stripeId: String,
    wallet: Number,
    history: [historySchema],
    subId: String,
    card: { number: String, exp_month: Number, exp_year: Number, cvc: String },
  },
  { collection: "serveurs" }
);
serveurSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Serveur", serveurSchema);
