const Restaurateur = require("../model/Restaurateur");
const Serveur = require("../model/Serveur");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const date = require("date-and-time");

const { options } = require("../routes/restaurateur");
var stripe = require("stripe")(
  "sk_test_51HAujDGy1HBMy8sBfBqUaxDiLc2yzSl4bQUAIv9nhr77I0XfNEUn911esqNSHdZscrebHUY0UoWxbGeSY25qShKd00hTSRd2e8"
);

const restaurateurController = {
  /**
   * PARTIE MENU
   */

  /*Afficher les menus*/
  getMenu: (req, res, next) => {
    Restaurateur.findOne({ _id: req.user._id }, "menu", (err, data) => {
      if (err) {
        res.status(500).send("Une erreur s'est produite");
        return;
      }
      res.json(data);
    });
  },

  /*Ajouter les menus*/
  addMenu: (req, res, next) => {
    req.files.forEach((e) => {
      req.user.menu.otherMenu.push({ picture: e.path.replace("public", "") });
    });

    req.user.save((err) => {
      if (err) {
        res.status(500).json({ message: "Erreur" });
      } else {
        res.json({ message: "Menus ajoutés" });
      }
    });
  },

  /*Supprimer les menus*/
  deleteMenu: (req, res, next) => {
    Restaurateur.updateOne(
      { _id: req.user._id },
      {
        $pull: {
          "menu.otherMenu": {
            picture: req.body.picture,
          },
        },
      },

      (err) => {
        if (err) {
          console.log(err);
          res.json({ message: "une erreur s'est produite" });
        } else {
          res.json({
            message: "Suppression ok",
          });
          console.log(req.body.picture);
        }
      }
    );
  },

  /*Ajouter le menu du jour */
  addDailyMenu: (req, res, next) => {
    console.log(req.file.path);
    const filePath = req.file.path.replace("public", "");
    const now = new Date();
    Restaurateur.updateOne(
      { _id: req.user._id },
      {
        $set: {
          "menu.dailyMenu": {
            picture: filePath,
            label: date.format(now, "DD/MM/YYYY"),
          },
        },
      },
      (err) => {
        if (err) {
          console.log(err);
          res.json({ message: "une erreur s'est produite" });
        } else {
          res.json({
            message: "Photo ok ",
          });
          console.log(req.body.picture);
        }
      }
    );
  },

  deleteDailyMenu: (req, res, next) => {
    Restaurateur.updateOne(
      { _id: req.user._id },
      {
        $set: {
          "menu.dailyMenu": {
            picture: "",
            label: "",
          },
        },
      },

      (err) => {
        if (err) {
          console.log(err);
          res.json({ message: "une erreur s'est produite" });
        } else {
          res.json({
            message: "Votre menu a bien été supprimé",
          });
        }
      }
    );
  },

  /**
   * PARTIE PROFIL
   */

  /*Inscription*/
  verify: (req, res, next) => {
    if (!req.query.id) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    /* ETAPE 1: Trouver le restaurateur */
    Restaurateur.findOne({ verificationId: req.query.id }, (error, user) => {
      /* En cas d'erreur */
      if (error) {
        res.status(500).json({ message: "An error has occured" });
        return;
      }

      /* Aucun restaurateur trouvé */
      if (!user) {
        res.status(404).json({ message: "Not found" });
        return;
      }

      /* ETAPE 2: Création de l'utilistaeur MangoPay */
      stripe.customers
        .create({
          email: user.email,
          description: "Restaurateur",
        })
        .then(
          /* Restaurateur enregistré comme utilisateur MangoPay */
          (model) => {
            /* ETAPE 3: Engresitrement de la vérification du restaurateur */
            user.confirmed = true;
            user.verificationId = null;
            user.stripeId = model.id;

            /* Enregistrement du restaurateur */
            user.save((error) => {
              /* En cas d'erreur */
              if (error) {
                res.status(500).json({
                  message: "An error has occured",
                });
                return;
              }
              res.redirect(
                "http://localhost:3000/connexionAbo" //'<header  style=" background-color:#f4a521"> <h1 style="color: white; font-size: 30px; text-align:center; padding:10px; font-family:arial">TIPOURBOIRE</h1></header> <p style=" padding:15px; text-align:center; font-size:18px; font-family:arial">Vous êtes maintenant inscrit à TiPourBoire !<br/> Veuillez vous connecter pour vous abonner. <br/> <br/>  <a style=" margin-top:15px; text-decoration:none; color: #f4a521; font-weight:bold; font-size:23px; font-family:arial" href=http://localhost:3000/connexionAbo>S\'abonner</a> </p>  <footer style="background-color:#f4a521; padding:10px "></footer>'
              );
            });
          }
        );
    });
  },

  inscription: (req, res, next) => {
    const emailVerif = RegExp("([A-z]|[0-9])+@([A-z]|[0-9])+.[A-z]{2,3}");
    const passwordVerif = RegExp(
      "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$"
    );

    /*stockage d'un mot de passe crypté dans la base de données apres le req*/
    const hash = bcrypt.hashSync(req.body.password, 10);

    if (
      typeof req.body.restaurantName != "string" ||
      typeof req.body.bossFirstName != "string" ||
      typeof req.body.phone != "string" ||
      typeof req.body.bossName != "string" ||
      typeof req.body.adress != "string" ||
      emailVerif.test(req.body.email) == false
    ) {
      res.status(417);
      res.json({
        message:
          "Veuillez compléter les champs obligatoires et respecter le format de saisie.",
      });
    } else if (passwordVerif.test(req.body.password) == false) {
      res.status(417);
      res.json({
        message:
          "Votre mot de passe doit comporter au minimum 8 caractères dont une minuscule, une majuscule, un chiffre et un caractère spécial.",
      });
    } else {
      /*TEST ENVOI MAIL*/
      let rand = new Array(10).fill("").reduce(
        (accumulator) =>
          accumulator +
          Math.random()
            .toString(36)
            .replace(/[^a-z]+/g, "")
            .substr(0, 5)
      );

      const newRestaurateur = new Restaurateur({
        restaurantName: req.body.restaurantName,
        bossFirstName: req.body.bossFirstName,
        phone: req.body.phone,
        email: req.body.email,
        password: hash /*mdp hashé*/,
        bossName: req.body.bossName,
        adress: req.body.adress,
        location: {
          longitude: req.body.longitude,
          latitude: req.body.latitude,
        },
        serviceNumber: {
          noon: req.body.noon === "on",
          evening: req.body.evening === "on",
        },
        logo: "/images/logo-init.png",
        menu: { dailyMenu: { picture: "", label: "" }, otherMenu: [] },
        confirmed: false,
        verificationId: rand,
        stripeId: "",
        abonne: false,
        subId: "",
      });
      newRestaurateur.save((err) => {
        if (err) {
          console.log(err);
          res.json({
            message:
              "L'e-mail saisi est déja lié à un compte. Veuillez vous connecter ou saisir une autre adresse mail.",
          });
        } else {
          res.json({
            message:
              "Merci pour votre inscription ! Un e-mail de confirmation vient de vous être envoyé.",
          });
        }
      });
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL || "tiptotest@gmail.com",
          pass: process.env.PASSWORD || "!TTTmdp51!",
        },
      });

      link = "http://localhost:8080/restaurateur/verify?id=" + rand;
      let mailOptions = {
        from: "tiptotest@gmail.com",
        to: req.body.email,
        subject: "Nodemailer - Test",
        html:
          '<header  style=" background-color:#f4a521"> <h1 style="color: white; font-size: 30px; text-align:center; padding:10px">TIPOURBOIRE</h1></header> <p style=" padding:15px; text-align:center; font-size:18px; font-family:arial">Bonjour et merci pour votre inscription à TiPourBoire ! <br/> Cliquez sur le lien ci-dessous pour confirmer votre inscription. <br/> <br/>  <a style=" margin-top:15px; text-decoration:none; color: #f4a521; font-weight:bold; font-size:23px; font-family:arial" href=' +
          link +
          '>Confirmer</a> </p>  <footer style="background-color:#f4a521; padding:10px "></footer>',
      };

      transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
          return console.log("Error occurs");
        }
        return console.log("Email sent!!!");
      });
    }
  },

  /*Récupération du profil du restaurateur connecté*/
  getProfil: (req, res) => {
    res.json(req.user);
    /*permet de ne pas afficher le password crypté*/
  },
  getLogo: (req, res, next) => {
    const filePath = req.file.path.replace("public", "");
    Restaurateur.updateOne(
      { _id: req.user._id },
      {
        $set: {
          logo: filePath,
        },
      },

      (err) => {
        if (err) {
          console.log(err);
          res.json({ message: "une erreur s'est produite" });
        } else {
          res.json({
            message: "Photo ok ",
          });
          console.log(req.body.logo);
          console.log(req.file.path);
        }
      }
    );
  },

  /*Modification du profil du restaurateur connecté*/
  editProfil: (req, res, next) => {
    const emailVerif = RegExp("([A-z]|[0-9])+@([A-z]|[0-9])+.[A-z]{2,3}");

    if (
      typeof req.body.restaurantName != "string" ||
      typeof req.body.bossFirstName != "string" ||
      typeof req.body.bossName != "string" ||
      typeof req.body.phone != "string" ||
      typeof req.body.adress != "string" ||
      emailVerif.test(req.body.email) == false
    ) {
      res.status(417);
      res.json({
        message:
          "Veuillez compléter les champs obligatoires et respecter le format de saisie.",
      });
    } else {
      Restaurateur.updateOne(
        /*Modif et mise à jour des données l'user repéré grace a son id */
        {
          _id: req.user.id,
        },
        {
          restaurantName: req.body.restaurantName,
          email: req.body.email,
          phone: req.body.phone,
          bossName: req.body.bossName,

          adress: req.body.adress,
          bossFirstName: req.body.bossFirstName,
        },
        (err) => {
          if (err) {
            console.log(err);
            res.json({ message: "une erreur s'est produite" });
          } else {
            res.json({
              message:
                "Vos modifications ont bien été prises en compte. Merci.",
            });
          }
        }
      );
    }
  },

  /**
   * LOGIN MOT DE PASSE
   */

  login: (req, res, next) => {
    const verifEmail = RegExp("([A-z]|[0-9])+@([A-z]|[0-9])+.[A-z]{2,3}");
    const email = req.body.email;

    if (
      verifEmail.test(email) == false ||
      typeof req.body.password != "string" /**check des formats emails et pwd */
    ) {
      res.status(417);
      res.json({
        message:
          "Saisie incorrects. Veuillez ressaisir vos identifiants et mot de passe.",
      });
    } else if (Restaurateur.confirmed == false) {
      res.status(417).json({
        message:
          "Veuillez confirmer votre adresse e-mail pour pouvoir vous connecter",
      });
    } else {
      /*comparaison email user et base de donnée si match ou pas */
      Restaurateur.findOne({ email: req.body.email }, (err, data) => {
        if (!data) {
          return res
            .status(401)
            .json({ message: "Identifiant et/ou Mot de passe incorrects" });
        }
        bcrypt.compare(req.body.password, data.password, (err, result) => {
          if (err) {
            console.log(err);
            res.status(500).json({
              message: "une erreur s'est produite",
            }); /*erreur de saisie ou autre err*/
          } else if (!data || !result) {
            res.status(401).json({
              message:
                "Identifiant et/ou Mot de passe incorrects" /*donnée ne matche pas avec database*/,
            });
          } else if (data.abonne === false) {
            res.status(401).json({
              message: "Vous devez être abonné pour pouvoir accéder au site.",
            });
          } else {
            res.status(200).json({
              userId: data._id,
              token: jwt.sign({ userId: data._id }, "RANDOM_TOKEN_SECRET", {
                expiresIn: "24h",
                /*durée de validité du Token, l'utilisateur devra se reconnecter au bout de 24h*/
              }),
              message: "Connexion Réussie !" /*good password */,
            });
          }
        });
      });
    }
  },
  loginAbo: (req, res, next) => {
    const verifEmail = RegExp("([A-z]|[0-9])+@([A-z]|[0-9])+.[A-z]{2,3}");
    const email = req.body.email;

    if (
      verifEmail.test(email) == false ||
      typeof req.body.password != "string" /**check des formats emails et pwd */
    ) {
      res.status(417);
      res.json({
        message:
          "Saisie incorrects. Veuillez ressaisir vos identifiants et mot de passe.",
      });
    } else if (Restaurateur.confirmed == false) {
      res.status(417).json({
        message:
          "Veuillez confirmer votre adresse e-mail pour pouvoir vous connecter",
      });
    } else {
      /*comparaison email user et base de donnée si match ou pas */
      Restaurateur.findOne({ email: req.body.email }, (err, data) => {
        if (!data) {
          returnres
            .status(401)
            .json({ message: "Identifiant et/ou Mot de passe incorrects" });
        }
        bcrypt.compare(req.body.password, data.password, (err, result) => {
          if (err) {
            console.log(err);
            res.status(500).json({
              message: "Une erreur s'est produite",
            }); /*erreur de saisie ou autre err*/
          } else if (!data || !result) {
            res.status(401).json({
              message:
                "Identifiant et/ou Mot de passe incorrects" /*donnée ne matche pas avec database*/,
            });
          } else {
            res.status(200).json({
              userId: data._id,
              token: jwt.sign({ userId: data._id }, "RANDOM_TOKEN_SECRET", {
                expiresIn: "24h",
                /*durée de validité du Token, l'utilisateur devra se reconnecter au bout de 24h*/
              }),
              message: "Connexion Réussie !" /*good password */,
            });
          }
        });
      });
    }
  },

  /*Récupération du QR code */
  getQRCODE: (req, res) => {
    res.json(req.user.qrCode);
  },

  /**
   * PARTIE GESTION PERSONNEL
   */

  /*Récupération de la liste des serveurs*/
  getWaiterList: (req, res) => {
    Serveur.find(
      { "restaurantName._id": req.user._id },
      "lastname firstname staff email",
      (err, data) => {
        if (err) {
          res.status(500).end();
        } else {
          res.json(data);
        }
      }
    );
  },
  /*Suppression d'un serveur de son restaurant*/
  deleteWaiter: (req, res) => {
    Serveur.updateOne(
      { _id: req.body._id },
      { $set: { restaurantName: "" } },
      (err, data) => {
        if (err) {
          res.status(500).end();
        } else {
          res.json({ message: "Suppression Ok" });
          console.log(req.body._id);
        }
      }
    );
  },

  /**
   * PARTIE AFFILIATION
   */

  envoiMailAffiliation: (req, res) => {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL || "tiptotest@gmail.com",
        pass: process.env.PASSWORD || "!TTTmdp51!",
      },
    });

    let rand = new Array(10).fill("").reduce(
      (accumulator) =>
        accumulator +
        Math.random()
          .toString(36)
          .replace(/[^a-z]+/g, "")
          .substr(0, 5)
    );

    link =
      "http://localhost:8080/restaurateur/confirmAffi?email=" +
      req.body.email +
      "&_id=" +
      req.user._id +
      "&name=" +
      req.user.restaurantName;
    let mailOptions = {
      from: "tiptotest@gmail.com",
      to: req.body.email,
      subject: "Nodemailer - Test",

      html:
        '<header  style= "background-color:#f4a521"> <h1 style="color: white; font-size: 30px; text-align:center; padding:10px">TIPOURBOIRE</h1></header><p style=" padding:15px; text-align:center; font-size:18px; font-family:arial">Bonjour, le restaurant ' +
        req.user.restaurantName +
        ' veut s\'affilier avec vous. <br/> Pour accepter la demande, cliquez sur le lien ci-dessous. <br/><br/>  <a  style=" margin-top:15px; text-decoration:none; color: #f4a521; font-weight:bold; font-size:23px; font-family:arial" href=' +
        link +
        '>Confirmer</a> </p><footer style="background-color:#f4a521; padding:10px "></footer>',
    };
    transporter.sendMail(mailOptions, (err, data) => {
      if (err) {
        return console.log("Error occurs");
      }
      return res.json({ message: "Votre email a bien été envoyé" });
    });
  },

  /* A VOIR AVEC WENDY/LAMBERT*/
  validAffiliation: (req, res) => {
    if (!req.query.email) {
      res.status(404).json({ message: "Not found1" });
      return;
    }
    Serveur.updateOne(
      { email: req.query.email },
      {
        $set: {
          restaurantName: {
            _id: req.query._id,
            name: req.query.name,
          },
        },
      },
      (err, result) => {
        if (err) {
          res.status(417).json({ message: "erreur" });
          console.log(err);
          return;
        }
        if (result.nModified == 0) {
          res.status(404).json({ message: "Not found" });
          return;
        }
        res.send("<h2> Affichage de la page profil du serveur </h2>");
        console.log(result);
      }
    );
  },
  /**
   * PARTIE STRIPE
   */

  createSubscription: async (req, res) => {
    Restaurateur.findOne({ _id: req.user._id }, async (err, user) => {
      try {
        await stripe.paymentMethods.attach(req.body.paymentMethodId, {
          customer: user.stripeId,
        });
      } catch (error) {
        return res.status("402").send({ error: { message: error.message } });
      }
      await stripe.customers.update(user.stripeId, {
        invoice_settings: {
          default_payment_method: req.body.paymentMethodId,
        },
      });
      // Create the subscription
      stripe.subscriptions
        .create({
          customer: user.stripeId,
          items: [{ price: "price_1HAvcJGy1HBMy8sBsYumqTQg" }],
          expand: ["latest_invoice.payment_intent"],
          trial_period_days: 90,
        })
        .then((model) => {
          user.abonne = true;
          user.subId = model.id;
          user.save((error) => {
            /* En cas d'erreur */
            if (error) {
              res.status(500).json({
                message: "An error has occured",
              });
              return;
            }
            res.json({ message: "Votre abonnement est bien confirmé !" });
          });
        });
    });
  },

  unSubscription: (req, res) => {
    Restaurateur.findOne({ _id: req.user.id }, (err, user) => {
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL || "tiptotest@gmail.com",
          pass: process.env.PASSWORD || "!TTTmdp51!",
        },
      });
      let mailOptions = {
        from: "tiptotest@gmail.com",
        to: user.email,
        subject: "Nodemailer - Test",
        html:
          '<header  style=" background-color:#f4a521"> <h1 style="color: white; font-size: 30px; text-align:center; padding:10px">TIPOURBOIRE</h1></header> <p style=" padding:15px; text-align:center; font-size:18px; font-family:arial">Bonjour, votre demande de désabonnement a bien été prise en compte. <br/> Votre abonnement sera définitivement résilié à la fin de votre mensualité. <br/> A bientôt</p>  <footer style="background-color:#f4a521; padding:10px "></footer>',
      };

      transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
          return console.log("Error occurs");
        }
        return console.log("Email sent!!!");
      });
      Serveur.find({ "restaurantName._id": user._id }, (error, serveurs) => {
        let transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL || "tiptotest@gmail.com",
            pass: process.env.PASSWORD || "!TTTmdp51!",
          },
        });
        let maillist = [serveurs.email];
        let mailOptions = {
          from: "tiptotest@gmail.com",
          to: maillist,
          subject: "Nodemailer - Test",
          html:
            '<header  style=" background-color:#f4a521"> <h1 style="color: white; font-size: 30px; text-align:center; padding:10px">TIPOURBOIRE</h1></header> <p style=" padding:15px; text-align:center; font-size:18px; font-family:arial">Bonjour, le restaurant ' +
            user.restaurantName.name +
            " a choisi de se désabonner de TiPourBoire. <br/> Si vous n'avez pas d'autres restaurant affilié vous pouvez choisir de vous désabonner directement via votre profil. <br/> A bientôt</p>  <footer style=\"background-color:#f4a521; padding:10px \"></footer>",
        };
        if (!maillist) {
          stripe.subscriptions.update(user.subId, {
            cancel_at_period_end: true,
          });
        } else {
          transporter.sendMail(mailOptions, (err, data) => {
            if (err) {
              return console.log("Error occurs");
            }
            return console.log("Email sent!!!");
          });
        }
      });

      stripe.subscriptions.update(user.subId, { cancel_at_period_end: true });
      user.subId = null;
      user.save((error) => {
        /* En cas d'erreur */
        if (error) {
          res.status(500).json({
            message: "An error has occured",
          });
          return;
        }
        res.json({ message: "Vous êtes bien désabonné(e)" });
      });
    });
  },
};

module.exports = restaurateurController;
