const { execSync } = require('child_process');

const start = new Date('2025-05-01');
const end = new Date(); // aaj ki date

for (
  let d = new Date(start);
  d <= end;
  d.setDate(d.getDate() + 1)
) {
  const dateStr = d.toISOString().split('T')[0];
  console.log(`\n=== Running for ${dateStr} ===`);
  try {
    execSync(`node -e "process.env.SYNC_DATE='${dateStr}'; require('./syncAttendance.js')"`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`? Error on ${dateStr}:`, err.message);
  }
}
console.log('\n?? All dates processed!');