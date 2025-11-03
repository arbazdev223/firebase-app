const { pool } = require('../config/db'); // Import MySQL connection

exports.getAllAttendance = async () => {
  try {
    // Query MySQL using the correct pool
    const [rows] = await pool.query('SELECT * FROM attendances');
    return rows;
  } catch (error) {
    throw error;
  }
};