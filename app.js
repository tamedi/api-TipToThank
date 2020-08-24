var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var restaurateurRouter = require("./routes/restaurateur");
var serveurRouter = require("./routes/serveur");
var clientRouter = require("./routes/client");

//import de mongoose
const mongoose = require("mongoose");
//import de cors
const cors = require("./middlewares/cors");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors.handle);
//data base connection
mongoose.connect(
  "mongodb+srv://Bocal:cacahuete22%23@tiptothankdb.kqk7h.gcp.mongodb.net/dev?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
mongoose.connection.once("open", () => {
  console.log("database connected");
});

app.use("/", indexRouter);
app.use("/restaurateur", restaurateurRouter);
app.use("/serveur", serveurRouter);
app.use("/client", clientRouter);

module.exports = app;
