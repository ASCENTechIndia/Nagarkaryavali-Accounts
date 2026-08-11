const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");

async function userDeptMasterProc(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN
           aoac_userdept_map_config_ins(
             :In_UserId,
             :In_UlbId,
             :In_UserDeptStr,
             :In_Mode,
             :In_LoginUserId,
             :In_IpAddress,
             :In_Source,
             :Out_ErrorCode,
             :Out_ErrorMsg
           );
         END;`,
        {
          In_UserId: data.userId,
          In_UlbId: Number(data.ulbId),
          In_UserDeptStr: data.userDeptStr,
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

    return {
      success: true,
      errorCode: result.Out_ErrorCode,
      errorMsg: result.Out_ErrorMsg,
    };
  } catch (err) {
    console.error("aoac_userdept_map_config_ins Error:", err);
    return {
      success: false,
      error: err.message,
    };
  }
}

async function getUserDeptList(data) {
  const query = `
    SELECT
      m.num_userdept_deptid AS deptid,
      d.deptname
    FROM aoac_userdept_map_config m
    LEFT JOIN vw_accdeptconfig d
           ON d.deptid = m.num_userdept_deptid
          AND d.ulbid = m.num_userdept_ulbid
    WHERE m.num_userdept_userid = :userId
      AND m.num_userdept_ulbid = :ulbId
    ORDER BY m.num_userdept_deptid
  `;

  const result = await executeQuery(query, {
    userId: data.userId,
    ulbId: data.ulbId,
  });

  return result.rows;
}

async function userZoneMasterProc(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN
           aoac_userzone_map_config_ins(
             :In_UserId,
             :In_UlbId,
             :In_UserZoneStr,
             :In_Mode,
             :In_LoginUserId,
             :In_IpAddress,
             :In_Source,
             :Out_ErrorCode,
             :Out_ErrorMsg
           );
         END;`,
        {
          In_UserId: data.userId,
          In_UlbId: Number(data.ulbId),
          In_UserZoneStr: data.userZoneStr,
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


    return {
      success: true,
      errorCode: result.Out_ErrorCode,
      errorMsg: result.Out_ErrorMsg,
    };
  } catch (err) {
    console.error("aoac_userzone_map_config_ins Error:", err);
    return {
      success: false,
      error: err.message,
    };
  }
}

async function getUserZoneList(data) {
  const query = `
    SELECT
      m.num_userzone_zoneid AS zoneid
    FROM aoac_userzone_map_config m
    WHERE m.num_userzone_userid = :userId
      AND m.num_userzone_ulbid = :ulbId
    ORDER BY m.num_userzone_zoneid
  `;

  const result = await executeQuery(query, {
    userId: data.userId,
    ulbId: data.ulbId,
  });

  return result.rows;
}

module.exports = {
  userDeptMasterProc,
  getUserDeptList,
  userZoneMasterProc,
  getUserZoneList
};