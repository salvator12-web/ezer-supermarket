const router = require("express").Router();
const ctrl = require("../controllers/delivery.controller");

// Public — used live at checkout to show the delivery fee before placing the order
router.post("/quote", ctrl.quote);

module.exports = router;
