const express = require("express");
const { addHoliday, getHolidays, deleteHoliday } = require("../controllers/holidayController");

const router = express.Router();

router.post("/", addHoliday);
router.get("/", getHolidays);
router.delete("/:id", deleteHoliday);

module.exports = router;
