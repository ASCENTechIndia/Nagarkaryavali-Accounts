const oracledb = require("oracledb");
const { DB_USER, DB_PASSWORD, DB_CONNECT_STRING } = require("./config/env");

async function getConnection() {
  try {
    const connection = await oracledb.getConnection({
      user: DB_USER,
      password: DB_PASSWORD,
      connectString: DB_CONNECT_STRING,
    });

    return connection;
  } catch (err) {
    console.error("Oracle DB connection error:", err);
    throw err;
  }
}

module.exports = getConnection;