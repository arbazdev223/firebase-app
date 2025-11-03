// Set timezone to IST for testing
process.env.TZ = 'Asia/Kolkata';

console.log('🧪 Testing Timezone Configuration for IFDA Attendance System');
console.log('=' .repeat(60));

// Test 1: Basic timezone settings
console.log('\n📅 Test 1: Basic Timezone Settings');
console.log('Current IST time:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
console.log('Server timezone:', process.env.TZ || 'Not set');
console.log('UTC time:', new Date().toISOString());
console.log('Local time:', new Date().toString());

// Test 2: Date handling for attendance
console.log('\n📊 Test 2: Attendance Date Handling');
const now = new Date();
const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
const istDate = new Date(now.getTime() + istOffset);

const today = new Date(istDate);
today.setHours(0, 0, 0, 0);

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

console.log('IST Date:', istDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
console.log('Today (IST):', today.toISOString().split('T')[0]);
console.log('Tomorrow (IST):', tomorrow.toISOString().split('T')[0]);

// Test 3: MySQL timezone conversion
console.log('\n🗄️ Test 3: MySQL Timezone Conversion');
const sampleLogIn = '2024-02-10 16:08:42.000000';
console.log('Sample logIn:', sampleLogIn);

// Simulate MySQL CONVERT_TZ function
const mysqlQuery = `
SELECT 
  emp_code,
  DATE(CONVERT_TZ('${sampleLogIn}', '+00:00', '+05:30')) AS attendance_date,
  MIN(TIME(CONVERT_TZ('${sampleLogIn}', '+00:00', '+05:30'))) AS log_in,
  MAX(TIME(CONVERT_TZ('${sampleLogIn}', '+00:00', '+05:30'))) AS log_out,
  device_name
FROM attendances
WHERE CONVERT_TZ(logIn, '+00:00', '+05:30') >= '${today.toISOString().split('T')[0]}' 
  AND CONVERT_TZ(logIn, '+00:00', '+05:30') < '${tomorrow.toISOString().split('T')[0]}'
GROUP BY emp_code, DATE(CONVERT_TZ(logIn, '+00:00', '+05:30')), device_name
`;

console.log('MySQL Query with IST conversion:');
console.log(mysqlQuery);

// Test 4: Cron timing
console.log('\n⏰ Test 4: Cron Job Timing');
const cronExpression = '*/5 * * * *';
console.log('Cron expression:', cronExpression);

const now2 = new Date();
const hours = now2.getHours();
const minutes = now2.getMinutes();

const isMorningShift = (hours >= 8 && hours < 11); // 08:00 to 10:59
const isEveningShift = (hours >= 16 && (hours < 20 || (hours === 20 && minutes === 0))); // 16:30 to 20:00

console.log('Current time (IST):', `${hours}:${minutes < 10 ? '0' + minutes : minutes}`);
console.log('Morning shift (8-11):', isMorningShift);
console.log('Evening shift (16:30-20):', isEveningShift);
console.log('Should run sync:', isMorningShift || (hours === 16 && minutes >= 30) || isEveningShift);

// Test 5: Office timing calculation
console.log('\n🏢 Test 5: Office Timing Calculation');
const sampleOfficeStart = '09:00';
const sampleOfficeEnd = '18:00';
const sampleLogInTime = '09:15';
const sampleLogOutTime = '18:30';

console.log('Office timing:', `${sampleOfficeStart} - ${sampleOfficeEnd}`);
console.log('Login time:', sampleLogInTime);
console.log('Logout time:', sampleLogOutTime);

const officeStart = new Date(`1970-01-01T${sampleOfficeStart}`);
const officeEnd = new Date(`1970-01-01T${sampleOfficeEnd}`);
const logInTimeObj = new Date(`1970-01-01T${sampleLogInTime}`);
const logOutTimeObj = new Date(`1970-01-01T${sampleLogOutTime}`);

const diffMinutes = (logInTimeObj - officeStart) / 60000;
const diffEndMinutes = (officeEnd - logOutTimeObj) / 60000;

console.log('Minutes late:', diffMinutes);
console.log('Minutes early leave:', diffEndMinutes);

let status = "Present";
if (diffEndMinutes <= -90) {
  status = "Half Day";
} else if (diffMinutes <= 0) {
  status = "Present";
} else if (diffMinutes > 0 && diffMinutes <= 15) {
  status = "Late";
} else if (diffMinutes > 15 && diffMinutes <= 45) {
  status = "Much Late";
} else {
  status = "Half Day";
}

console.log('Calculated status:', status);

console.log('\n✅ Timezone testing completed!');
console.log('=' .repeat(60)); 