const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");

async function userZoneDeptMasterProc(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `
        BEGIN
          aoac_userzonedept_ins(
            :In_UserId,
            :In_UlbId,
            :In_ZoneId,
            :In_UserZoneDeptStr,
            :In_Mode,
            :In_LoginUserId,
            :In_IpAddress,
            :In_Source,
            :Out_ErrorCode,
            :Out_ErrorMsg
          );
        END;
        `,
        {
          In_UserId: data.userId,

          In_UlbId: Number(data.ulbId),

          In_ZoneId: Number(data.zoneId),

          In_UserZoneDeptStr: data.userZoneDeptStr,

          In_Mode: Number(data.mode),

          In_LoginUserId: data.loginUserId,

          In_IpAddress: data.ipAddress || "",

          In_Source: data.source || "API",

          Out_ErrorCode: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER,
          },

          Out_ErrorMsg: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 2000,
          },
        }
      );

      return res.outBinds;
    });

    console.log("User Zone Dept Procedure Result:", result);

    return {
      success: true,
      errorCode: result.Out_ErrorCode,
      errorMsg: result.Out_ErrorMsg,
    };
  } catch (err) {
    console.error(
      "aoac_userzonedept_ins Error:",
      err
    );

    return {
      success: false,
      error: err.message,
    };
  }
}

async function getUserZoneDeptList(data) {
    const query = `
        SELECT
            m.num_userzonedept_deptid AS deptid,
            d.deptname
        FROM aoac_userzonedept_map m
        LEFT JOIN vw_accdeptconfig d
               ON d.deptid = m.num_userzonedept_deptid
              AND d.ulbid = m.num_userzonedept_ulbid
        WHERE m.num_userzonedept_userid = :userId
          AND m.num_userzonedept_zoneid = :zoneId
          AND m.num_userzonedept_ulbid = :ulbId
        ORDER BY m.num_userzonedept_deptid
    `;

    const result = await executeQuery(
        query,
        {
            userId: data.userId,
            zoneId: data.zoneId,
            ulbId: data.ulbId,
        }
    );

    return result.rows;
}

module.exports = {
  userZoneDeptMasterProc,
  getUserZoneDeptList
};