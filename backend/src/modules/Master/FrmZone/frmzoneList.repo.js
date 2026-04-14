const { executeQuery } = require("../../../db/queryExecutor");
const oracledb = require("oracledb");
const { executeProcedure } = require("../../../db/procedureExecutor");

async function getCorporationRepo({ corpId }) {
  console.log("📤 Repo: Fetch Corporation", { corpId });

  const sql = `
    SELECT 
      num_corporation_id,
      var_corporation_name
    FROM admins.aoma_corporation_mas
    WHERE num_corporation_id = :corpId
    ORDER BY var_corporation_name
  `;

  const binds = { corpId };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}


async function saveZoneRepo(payload) {
  console.log("📤 Repo: Execute Zone Procedure", payload);

  const sql = `
    BEGIN
      aoac_zone_ins(
        :in_zoneid,
        :in_zonename,
        :in_UserId,
        :in_Mode,
        :in_ulbid,
        :out_ErrorCode,
        :out_ErrorMsg
      );
    END;
  `;

  const binds = {
    in_zoneid: payload.zoneId,
    in_zonename: payload.zoneName,
    in_UserId: payload.userId,
    in_Mode: payload.mode,
    in_ulbid: payload.ulbId,

    out_ErrorCode: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    out_ErrorMsg: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 500 },
  };

  const result = await executeProcedure({ sql, binds });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.outBinds;
}

module.exports = {
  getCorporationRepo,
  saveZoneRepo
};