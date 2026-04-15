const oracledb = require("oracledb");
const getConnection = require("../config/db");

/**
 * Generic query executor (Oracle)
 * @param {string} sql - SQL with :params
 * @param {Object} binds - bind variables { key: value }
 * @param {Object} options - extra options (optional)
 */
async function executeQuery(sql, binds = {}, options = {}) {
  let connection;

  try {
    connection = await getConnection();

    const start = Date.now();

    const result = await connection.execute(
      sql,
      binds,
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: options.autoCommit || false
      }
    );

    const duration = Date.now() - start;

    return {
      success: true,
      rows: result.rows || [],
      rowCount: result.rows ? result.rows.length : 0,
      executionTimeMs: duration
    };

  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error("Error closing connection:", e);
      }
    }
  }
}

module.exports = { executeQuery };