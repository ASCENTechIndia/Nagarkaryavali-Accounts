const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");

// ============================================
// GET INTEREST LIST
// ============================================
async function getInterestListRepo(payload) {
  try {
    const query = `
      SELECT
        NUM_INTEREST_ID       AS INTEREST_ID,
        NUM_INTEREST_ULBID    AS ULBID,
        DAT_INTEREST_FROMDATE AS FROM_DATE,
        DAT_INTEREST_TODATE   AS TO_DATE,
        NUM_INTEREST_RATE     AS INTEREST_RATE,
        VAR_INTEREST_INSBY    AS INSERTED_BY,
        VAR_INTEREST_UPDBY    AS UPDATED_BY,
        DAT_INTEREST_INSDATE  AS INSERTED_DATE,
        DAT_INTEREST_UPDDATE  AS UPDATED_DATE
      FROM AOAC_INTEREST_MAS
      WHERE NUM_INTEREST_ULBID = :ULBID
      ORDER BY DAT_INTEREST_FROMDATE DESC
    `;

    const result = await executeQuery(query, {
      ULBID: payload.ulbId,
    });

    return result.rows;
  } catch (err) {
    throw err;
  }
}

// ============================================
// GET INTEREST BY ID
// ============================================
async function getInterestByIdRepo(payload) {
  try {
    const query = `
      SELECT
        NUM_INTEREST_ID       AS INTEREST_ID,
        NUM_INTEREST_ULBID    AS ULBID,
        DAT_INTEREST_FROMDATE AS FROM_DATE,
        DAT_INTEREST_TODATE   AS TO_DATE,
        NUM_INTEREST_RATE     AS INTEREST_RATE
      FROM AOAC_INTEREST_MAS
      WHERE NUM_INTEREST_ID = :INTEREST_ID
        AND NUM_INTEREST_ULBID = :ULBID
    `;

    const result = await executeQuery(query, {
      INTEREST_ID: payload.interestId,
      ULBID: payload.ulbId,
    });

    return result.rows;
  } catch (err) {
    throw err;
  }
}

// ============================================
// INSERT / UPDATE / DELETE INTEREST
// ============================================
async function insertInterestRepo(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN
            AOAC_INTEREST_INS(
              :IN_ULBID,
              :IN_INTEREST_ID,
              :IN_FROMDATE,
              :IN_TODATE,
              :IN_INTEREST_RATE,
              :IN_USERID,
              :IN_MODE,
              :OUT_ERRORCODE,
              :OUT_ERRORMSG
            );
         END;`,
        {
          IN_ULBID: data.ulbId,
          IN_INTEREST_ID: data.interestId || 0,
          IN_FROMDATE: data.fromDate ? new Date(data.fromDate) : null,
          IN_TODATE: data.toDate ? new Date(data.toDate) : null,
          IN_INTEREST_RATE: data.interestRate,
          IN_USERID: String(data.userId), // ensure varchar2
          IN_MODE: data.mode,

          OUT_ERRORCODE: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER,
          },
          OUT_ERRORMSG: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 1000,
          },
        }
      );

      console.log("insertInterestRepo", res.outBinds);

      return res.outBinds;
    });

    return {
      success: true,
      errorCode: result.OUT_ERRORCODE,
      errorMsg: result.OUT_ERRORMSG,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}

module.exports = {
  getInterestListRepo,
  getInterestByIdRepo,
  insertInterestRepo,
};