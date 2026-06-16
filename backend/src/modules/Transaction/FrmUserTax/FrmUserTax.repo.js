const oracledb = require("oracledb");
const { withTx } = require("../../../db/tx");
const { executeQuery } = require("../../../db/queryExecutor");

async function getAccUserMapListRepo(payload) {

  try {

    const query = `
      SELECT 
          mas.NUM_ACCUSERMAP_ID AS MAIN_ID,
          mas.NUM_ACCUSERMAP_USERID AS USER_ID,
          mas.NUM_ACCUSERMAP_WARD AS WARD_ID,
          mas.NUM_ACCUSERMAP_TRANSTYPEID AS TRANS_TYPE_ID,
          mas.VAR_ACCUSERMAP_RECNO AS RECEIPT_NO,
          mas.VAR_ACCUSERMAP_GLCODE AS GL_CODE,
          mas.VAR_ACCUSERMAP_ACCNO AS ACCOUNT_NO,
          mas.NUM_ACCUSERMAP_DEPTID AS DEPT_ID,
          mas.VAR_ACCUSERMAP_REMARK AS REMARKS,
          mas.VAR_ACCUSERMAP_INSBY AS CREATED_BY,
          TO_CHAR(mas.DAT_ACCUSERMAP_INSDATE, 'DD-Mon-YYYY HH24:MI:SS') AS CREATED_DATE
      FROM 
          AOMS_ACCUSERMAP_MAS mas
      LEFT JOIN 
          AOMS_ACCUSERMAP_DET det ON mas.NUM_ACCUSERMAP_ID = det.NUM_ACCMPDET_MAINID

      Where mas.VAR_ACCUSERMAP_INSBY = :userId

      GROUP BY 
          mas.NUM_ACCUSERMAP_ID,
          mas.NUM_ACCUSERMAP_USERID,
          mas.NUM_ACCUSERMAP_WARD,
          mas.NUM_ACCUSERMAP_TRANSTYPEID,
          mas.VAR_ACCUSERMAP_RECNO,
          mas.VAR_ACCUSERMAP_GLCODE,
          mas.VAR_ACCUSERMAP_ACCNO,
          mas.NUM_ACCUSERMAP_DEPTID,
          mas.VAR_ACCUSERMAP_REMARK,
          mas.VAR_ACCUSERMAP_INSBY,
          mas.DAT_ACCUSERMAP_INSDATE

      ORDER BY 
          mas.DAT_ACCUSERMAP_INSDATE DESC
    `;

    const result =
      await executeQuery(query, 
      {
        userId: payload.userId
      });

    return result.rows;

  } catch (err) {
    throw err;
  }
}

async function getAccUserMapByIdRepo(payload) {

  try {

    const query = `
      SELECT
          M.NUM_ACCUSERMAP_ID,
          M.NUM_ACCUSERMAP_USERID,
          M.NUM_ACCUSERMAP_WARD,
          M.NUM_ACCUSERMAP_TRANSTYPEID,
          M.VAR_ACCUSERMAP_RECNO,
          M.VAR_ACCUSERMAP_GLCODE,
          M.VAR_ACCUSERMAP_ACCNO,
          M.NUM_ACCUSERMAP_DEPTID,
          M.VAR_ACCUSERMAP_REMARK,

          D.NUM_ACCMPDET_ID,
          D.VAR_ACCMPDET_GLCODE,
          D.VAR_ACCMPDET_GLNAME,
          D.VAR_ACCMPDET_ACCNO,
          D.VAR_ACCMPDET_ACCNONAME

      FROM AOMS_ACCUSERMAP_MAS M
      LEFT JOIN AOMS_ACCUSERMAP_DET D
            ON D.NUM_ACCMPDET_MAINID = M.NUM_ACCUSERMAP_ID
      WHERE M.NUM_ACCUSERMAP_ID = :mainId
      ORDER BY D.NUM_ACCMPDET_ID
    `;

    const result =
      await executeQuery(
        query,
        {
          mainId: payload.mainId
        }
      );

    return result.rows;

  } catch (err) {
    throw err;
  }
}

async function saveAccUserMapRepo(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN
            AOMS_ACCUSERMAP_INS(
              :In_UserId,
              :In_ParamStr,
              :In_ParamStr2,
              :Out_ReturnStr,
              :Out_ErrorCode,
              :Out_ErrorMsg
            );
         END;`,

        {
          In_UserId: data.userId,

          In_ParamStr: data.paramStr,

          In_ParamStr2: data.paramStr2,

          Out_ReturnStr: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 4000,
          },

          Out_ErrorCode: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER,
          },

          Out_ErrorMsg: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 4000,
          },
        },
      );

      console.log("saveAccUserMapRepo", res.outBinds);

      return res.outBinds;
    });

    return {
      success: true,

      returnStr: result.Out_ReturnStr,

      errorCode: result.Out_ErrorCode,

      errorMsg: result.Out_ErrorMsg,
    };
  } catch (err) {
    return {
      success: false,

      error: err.message,
    };
  }
}

module.exports = {
  getAccUserMapListRepo,
  getAccUserMapByIdRepo,
  saveAccUserMapRepo
};
