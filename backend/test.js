const mongoose = require("mongoose");
const { InsertDailyAttendance } = require("./Commands/InsertDailyAttendance");
const dotenv = require('dotenv');
dotenv.config();
// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

(async () => {
    const holidays = await InsertDailyAttendance();
    console.log("Holidays data:", holidays);
    mongoose.connection.close();
})();