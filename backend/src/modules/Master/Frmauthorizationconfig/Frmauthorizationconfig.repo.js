const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");
const oracledb = require("oracledb");

// List
async function getAuthorizationConfigList() {
  const sql = `
    SELECT 
      num_authoriz_id AS authorizId,
      num_authoriz_ulbid AS ulbid,
      var_corporation_name AS corporationname,
      CASE 
        WHEN var_authoriz_flag = 'Y' THEN 'Active'
        ELSE 'Inactive'
      END AS status
    FROM aoac_authoriz_config
    INNER JOIN admins.aoma_corporation_mas 
      ON num_corporation_id = num_authoriz_ulbid
  `;

  const result = await executeQuery(sql);
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

async function getAuthorizationConfigDetails() {
  const sql = `
    SELECT 
      num_authoriz_id AS authorizId,
      num_authoriz_ulbid AS ulbid,
      var_corporation_name AS corporationname,
      var_authoriz_flag AS flag
    FROM aoac_authoriz_config
    INNER JOIN admins.aoma_corporation_mas 
      ON num_corporation_id = num_authoriz_ulbid
  `;

  const result = await executeQuery(sql);
  if (!result.success) throw new Error(result.error);

  return result.rows;
}
async function authorizationConfigProc(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN 
          aoac_authorizconfig_ins(
            :in_AuthorizId,
            :in_ULBId,
            :in_Flag,
            :in_UserId,
            :in_Mode,
            :out_ErrorCode,
            :out_ErrorMsg
          );
        END;`,
        {
          in_AuthorizId: data.authorizId || 0,
          in_ULBId: data.ulbId,
          in_Flag: data.flag,
          in_UserId: data.userId,
          in_Mode: data.mode,

          out_ErrorCode: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER,
          },
          out_ErrorMsg: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 1000,
          },
        },
      );

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
  getAuthorizationConfigList,
  getAuthorizationConfigDetails,
  authorizationConfigProc, // ✅ added
};
