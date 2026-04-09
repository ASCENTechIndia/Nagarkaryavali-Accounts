const oracledb = require("oracledb");
const getConnection = require("../config/db");

/**
 * Execute multiple operations inside Oracle transaction
 */
async function withTx(fn) {
  let connection;

  try {
    connection = await getConnection();

    const result = await fn(connection);

    await connection.commit();

    return result;

  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }
    throw err;

  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (_) {}
    }
  }
}

module.exports = { withTx };