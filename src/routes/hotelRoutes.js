const express = require("express");
const { saveHotelInfo } = require("../controllers/hotelController");

const router = express.Router();

router.post("/save-hotel-info", saveHotelInfo);

module.exports = router;
