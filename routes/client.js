/* SI TU N'ES PAS ILIAS OU SAIDA TU SORS */

var express = require("express");
var router = express.Router();

/*route for client infos*/
const clientController = require("../controllers/client");
const authentification = require("../middlewares/authentif");

router.post("/create-payment-intent", clientController.createPayementIntent);

/* POST Inscription client */

router.post("/register", clientController.register);

/*POST client data.*/
router.post("/getDataClient", authentification, clientController.getDataClient);

/* POST profil login. */
router.post("/login", clientController.login);

/* PUT client edit.*/
router.put("/edit", authentification, clientController.edit);
/*Mettre l'autenthif en commentaire quand on veux tester sur postman sinon ca fonctionne pas*/

/* DELETE client delete.*/
router.delete("/delete", authentification, clientController.delete);

/*GET  ou POST fonctionnent liste serveur*/
router.get("/getDataServeur", clientController.getDataServeur);

/*GET  ou POST fonctionnent liste serveur*/
router.get("/getMenu", clientController.getMenu);

module.exports = router;
