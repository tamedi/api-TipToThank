const Serveur = require("../model/Serveur");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { model } = require("../model/Serveur");
const stripe = require("stripe")(
  "sk_test_51HAxRlHoh2Vgz5Qd4gemyV84ODV8vdNB69QzOSv7Zn3MRGX09aNq4cbmZtHzYqwkCCVHE1F2CNd9b2v1sq9HiTdM00mEihmKKL"
);

/* Controller to register; get data of serveur; login; edit and delete serveur*/
const serveurController = {
  /*INSCRIPTION*/

  verify: (req, res, next) => {
    if (!req.query.id) {
      res.status(404).json({ message: "shit" });
      return;
    }

    /* ETAPE 1: Trouver le serveur */
    Serveur.findOne({ verificationId: req.query.id }, (error, user) => {
      /* En cas d'erreur */
      if (error) {
        res.status(500).json({ message: "An error has occured" });
        return;
      }

      /* Aucun serveur trouvé */
      if (!user) {
        res.status(404).json({ message: "Not found" });
        return;
      }

      /* ETAPE 2: Création de l'utilistaeur stripe */
      stripe.customers
        .create({
          description: "serveur",
          email: user.email,
        })
        .then(
          /* Restaurateur enregistré comme utilisateur MangoPay */
          (model) => {
            /* ETAPE 3: Engresitrement de la vérification du serveur */
            user.confirmed = true;
            user.verificationId = null;
            user.stripeId = model.id;

            /* Enregistrement du serveur */
            user.save((error) => {
              /* En cas d'erreur */
              if (error) {
                res.status(500).json({
                  message: "An error has occured",
                });
                return;
              }

              /* Réponse */
              res.redirect("http://localhost:3000/connexion");
            });
          }
        );
    });
  },

  paiement: (req, res, next) => {
    stripe.paymentMethods.create(
      {
        type: "card",
        card: {
          number: req.body.card.number,
          exp_month: req.body.card.exp_month,
          exp_year: req.body.card.exp_year,
          cvc: req.body.card.cvc,
        },
      },
      function (err, paymentMethod) {
        if (err) {
          console.log(err);
          res.status(500).json({
            message: "Il y a un problème dans l'enregistrement de votre carte",
          });
          return;
        }
        req.user.paymentMethodId = paymentMethod.id;
        req.user.save((error) => {
          /* En cas d'erreur */
          if (error) {
            res.status(500).json({
              message: "An error has occured",
            });
            return;
          }

          /* Réponse */
          res.json({ message: "votre carte a bien été enregistrée" });
        });
      }
    );
  },

  payout: (req, res) => {
    stripe.payouts.create({ amount: 1100, currency: "eur" }, function (
      err,
      payout
    ) {
      // asynchronously called
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
      typeof req.body.firstname != "string" ||
      typeof req.body.lastname != "string" ||
      typeof req.body.phone != "string" ||
      typeof req.body.adress != "string" ||
      typeof req.body.city != "string" ||
      typeof req.body.staff != "string" ||
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

      const newServeur = new Serveur({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        phone: req.body.phone,
        email: req.body.email,
        password: hash /*mdp hashé*/,
        date: req.body.date,
        adress: req.body.adress,
        city: req.body.city,
        staff: req.body.staff,
        confirmed: false,
        stripeId: "",
        verificationId: rand,
        subId: "",

        restaurantName: { _id: "", name: "" },
      });

      newServeur.save((err) => {
        if (err) {
          console.log(err);
          res.json({
            message:
              "L'e-mail saisi est déja lié à un compte. Veuillez vous connecter ou saisir une autre adresse mail.",
          });
        } else {
          res.json({
            message: "Votre compte à bien été crée",
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

      link = "http://localhost:8080/serveur/verify?id=" + rand;
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

  /*Récupération du profil du serveur connecté*/

  getServeur: (req, res, next) => {
    delete req.user.password; /*permet de ne pas afficher le password crypté*/
    res.json(req.user); /*on request sous format json les données du serveur */
  },

  login: (req, res, next) => {
    const cacahuete = RegExp("([A-z]|[0-9])+@([A-z]|[0-9])+.[A-z]{2,3}");
    const email = req.body.email;
    const mdp = RegExp(
      "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$"
    );
    const password = req.body.password;
    console.log(req.body);

    if (
      cacahuete.test(email) == false ||
      mdp.test(password) == false /**check des formats emails et pwd */
    ) {
      res.status(417);
      res.json({
        message:
          "Saisie incorrects. Veuillez ressaisir vos identifiants et mot de passe.",
      });
    } else {
      /*comparaison email user et base de donnée si match ou pas */
      Serveur.findOne({ email: req.body.email }, (err, data) => {
        if (err) {
          console.log(err);
          res.status(500).json({
            message: "une erreur s'est produite",
          }); /*erreur de saisie ou autre err*/
        } else if (!data) {
          res.status(401).json({
            message:
              "Identifiant de connexion incorrect." /*donnée ne matche pas avec database*/,
          });
        } else {
          /* quand utilisateur enfin ok => comparaison password avec bcrypt */
          bcrypt.compare(req.body.password, data.password, (err, result) => {
            if (err) {
              console.log(err);
              res.status(500).json({
                message: "Une erreur s'est produite.",
              }); /*erreur de saisie ou autre err*/
            } else if (!result) {
              res.status(401).json({
                message:
                  "Mot de passe incorrect." /*password ne matche pas avec database*/,
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
        }
      });
    }
  },
  edit: (req, res, next) => {
    if (
      typeof req.body.serveur.city != "string" ||
      typeof req.body.serveur.lastname != "string" ||
      typeof req.body.serveur.firstname != "string" ||
      typeof req.body.serveur.adress != "string" ||
      typeof req.body.serveur.staff != "string" ||
      (req.body.serveur.phone && typeof req.body.serveur.phone != "string")
    ) {
      res.status(417);
      res.json({
        message:
          "Veuillez compléter les champs au bon format pour confirmer la modification de votre compte.",
      });
    } else {
      Serveur.updateOne(
        /*Modif et mise à jour des données l'user repéré grace a son id */
        {
          _id: req.user._id,
          /* _id: "5f18130fd733700fa02869e2",*/
        },
        {
          city: req.body.serveur.city,
          lastname: req.body.serveur.lastname,
          firstname: req.body.serveur.firstname,
          adress: req.body.serveur.adress,
          phone: req.body.serveur.phone,
          staff: req.body.serveur.staff,
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
  getLogo: (req, res, next) => {
    const filePath = req.file.path.replace("public", "");
    Serveur.updateOne(
      { _id: req.user._id },
      {
        $set: {
          picture: filePath,
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
          console.log(req.file.path);
        }
      }
    );
  },

  createSubscription: async (req, res) => {
    Serveur.findOne({ _id: req.user._id }, async (err, user) => {
      try {
        await stripe.paymentMethods.attach(req.body.paymentMethodId, {
          customer: user.stripeId,
        });
      } catch (error) {
        return res.status("402").send({ error: { message: error.message } });
      }
      await stripe.customers.update(req.user.stripeId, {
        invoice_settings: {
          default_payment_method: req.body.paymentMethodId,
        },
      });

      // Create the subscription
      stripe.subscriptions
        .create({
          customer: user.stripeId,
          items: [{ price: "price_1HAxYZHoh2Vgz5QdzSq7HOHN" }],
          expand: ["latest_invoice.payment_intent"],
          trial_period_days: 90,
        })
        .then((model) => {
          user.subId = model.id;
          user.save((error) => {
            if (error) {
              res.status(500).json({
                message: "An error has occured",
              });
              return;
            }
            res.json(model);
          });
        });
    });
  },

  delete: (req, res, next) => {
    Serveur.deleteOne(
      {
        _id: req.user._id,
      },
      (err) => {
        if (err) {
          console.log(err);
          res.json({ message: "une erreur s'est produite" });
        } else {
          res.json({
            message:
              "La suppression de votre compte a bien été prise en compte. Merci.",
          });
        }
      }
    );
  },
  deleteWaiter: (req, res) => {
    Serveur.updateOne(
      { _id: req.user._id },
      { $set: { restaurantName: { _id: null, name: null } } },
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
  addToWallet: (req, res) => {
    Serveur.findOne({ _id: req.body.id }, (err, user) => {
      if (err) {
        res.status(500).json({ message: "error" });
        return;
      }
      if (!user) {
        res.status(400).json({ message: "waiter not found" });
        return;
      }
      const amount = parseFloat(req.body.amount);
      if (typeof user.wallet != "number") {
        user.wallet = 0;
      }
      user.wallet += amount;
      user.history.push({
        date: new Date().toISOString(),
        amount: amount,
      });
      user.save((err) => {
        if (err) {
          res.status(500).json({ message: "error" });
          return;
        }
        res.json({ message: "Changement sauvegarder" });
      });
    });
  },
};

module.exports = serveurController;
