const express = require("express");
const { sendWhatsAppAndSaveInfo } = require("../controllers/messageController");

const router = express.Router();

router.post("/send-whatsapp", sendWhatsAppAndSaveInfo);

module.exports = router;
