const { InsertDailyAttendance } = require('./Commands/InsertDailyAttendance');

// Get date from command line argument or use today
const dateArg = process.argv[2];
let targetDate = null;

if (dateArg) {
    // Validate date format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
        targetDate = new Date(dateArg); // ? FIXED: convert to Date object
        console.log(`?? Running attendance for date: ${dateArg}`);
    } else {
        console.error('? Invalid date format. Use YYYY-MM-DD (e.g., 2024-01-15)');
        process.exit(1);
    }
} else {
    targetDate = new Date(); // ? default to today
    console.log('?? Running attendance for today');
}

// Run attendance insertion
InsertDailyAttendance(targetDate)
    .then(() => {
        console.log('? Attendance insertion completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('? Attendance insertion failed:', error);
        process.exit(1);
    });
