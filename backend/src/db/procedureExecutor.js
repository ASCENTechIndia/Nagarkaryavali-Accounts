// const pool = require("../config/db");


// /**
//  * Execute a stored PROCEDURE or FUNCTION dynamically
//  *
//  * @param {Object} options
//  * @param {string} options.name       Procedure / Function name
//  * @param {Array}  options.params     [{ value, out?, type? }]
//  * @param {boolean} options.isFunction
//  * @param {boolean} options.useTx
//  */
// async function executeProcedure({
//   name,
//   params = [],
//   isFunction = false,
//   useTx = true,
// }) {
//   const client = await pool.connect();

//   try {
//     if (useTx) await client.query("BEGIN");

//     // Build placeholders: $1,$2,$3
//     const placeholders = params.map((_, i) => `$${i + 1}`).join(",");

//     let sql;
//     if (isFunction) {
//       sql = `SELECT * FROM ${name}(${placeholders})`;
//     } else {
//       sql = `CALL ${name}(${placeholders})`;
//     }

//     // Extract param values
//     const values = params.map((p) => p.value ?? null);

//     const start = Date.now();
//     const result = await client.query(sql, values);
//     const executionTimeMs = Date.now() - start;

//     if (useTx) await client.query("COMMIT");

//     return {
//       success: true,
//       procedure: name,
//       isFunction,
//       rowCount: result.rowCount || 0,
//       rows: result.rows || [],
//       executionTimeMs,
//     };
//   } catch (err) {
//     if (useTx) await client.query("ROLLBACK");
//     return {
//       success: false,
//       procedure: name,
//       error: err.message,
//     };
//   } finally {
//     client.release();
//   }
// }

// module.exports = { executeProcedure };


const oracledb = require("oracledb");
const getConnection = require("../config/db");

async function executeProcedure({ sql, binds = {} }) {
  let connection;

  try {
    connection = await getConnection();

    const start = Date.now();

    // const result = await connection.execute(sql, binds);
    const result = await connection.execute(sql, binds, {
      autoCommit: true
    });

    const duration = Date.now() - start;

    return {
      success: true,
      outBinds: result.outBinds || {},
      executionTimeMs: duration,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { executeProcedure };