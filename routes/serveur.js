/* SI TU N'ES PAS LAMBERT OU WENDY TU SORS */

var express = require("express");
var router = express.Router();

const multer = require("../middlewares/multer");

/*route for serveur infos*/
const serveurController = require("../controllers/serveur");
const authentification = require("../middlewares/auth");

/* POST Inscription serveur */
router.post("/register", serveurController.inscription);

router.get("/monProfil", authentification, serveurController.getServeur);
router.delete(
  "/deleteWaiter",
  authentification,
  serveurController.deleteWaiter
);
router.post("/dataProfil", authentification, serveurController.getServeur);
router.get("/verify", serveurController.verify);

/* POST profil login. */
router.post("/login", serveurController.login);

/* PUT serveur edit.*/
router.put("/edit", authentification, serveurController.edit);
router.put("/editLogo", authentification, multer, serveurController.getLogo);

/* DELETE serveur delete.*/
router.delete("/delete", authentification, serveurController.delete);

/* PUT abonnement edit.*/
router.put("/id", authentification, multer, serveurController.getLogo);
router.put("/iban", authentification, multer, serveurController.getLogo);
router.post("/paiement", authentification, serveurController.paiement);
router.post(
  "/createsubscription",
  authentification,
  serveurController.createSubscription
);

/* Show Wallet*/
router.post("/addtowallet", serveurController.addToWallet);
module.exports = router;
