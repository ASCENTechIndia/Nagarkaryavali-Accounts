// const { executeQuery } = require("../../db/queryExecutor");
// const { withTx } = require("../../db/tx");

// async function getMenuAccess(UserId) {
//   const sql = `
//     SELECT
//         num_menumaster_menuid AS menuid,
//         var_menumaster_pagetitle AS menutitle,
//         num_menumaster_parentmenuid AS parentid,
//         REPLACE(
//             REPLACE(var_menumaster_webpagepath, '..', ''),
//             '.aspx',
//             ''
//         ) AS pagepath,
//         num_menumaster_orderby AS orderby
//     FROM admins.aoma_menumaster_def
//     WHERE num_menumaster_parentmenuid = 0
//       AND num_menumaster_deptid = '7'
//       AND (var_menumaster_endsflag = 'Y' OR var_menumaster_endsflag IS NULL)
//       AND UPPER(var_menumaster_pagetitle) <> 'LOGOUT'

//     UNION

//     SELECT
//         mm.num_menumaster_menuid AS menuid,
//         mm.var_menumaster_pagetitle AS menutitle,
//         mm.num_menumaster_parentmenuid AS parentid,
//         REPLACE(
//             REPLACE(mm.var_menumaster_webpagepath, '..', ''),
//             '.aspx',
//             ''
//         ) AS pagepath,
//         mm.num_menumaster_orderby AS orderby
//     FROM admins.aoma_menuuser_def mu
//     INNER JOIN admins.aoma_menumaster_def mm
//         ON mm.num_menumaster_menuid = mu.num_menuuser_menuid
//     WHERE mu.var_menuuser_type = 'T'
//       AND mu.var_menuuser_userid = $1
//       AND mm.var_menumaster_webpagepath IS NOT NULL
//       AND mm.num_menumaster_deptid = '7'
//       AND (mm.var_menumaster_endsflag = 'Y' OR mm.var_menumaster_endsflag IS NULL)
//       AND UPPER(mm.var_menumaster_pagetitle) <> 'LOGOUT'

//     ORDER BY orderby
//   `;

//   return executeQuery(sql, [UserId]);
// }



// module.exports = {

//   getMenuAccess,

// };

const { executeQuery } = require("../../db/queryExecutor");
const getConnection = require("../../config/db");
const oracledb = require("oracledb");

async function getMenusRepo({ userId, ulbId, deptId }) {
  console.log("📤 Repo: Fetch Menus", { userId, ulbId, deptId });

  const sql = `
    SELECT num_menumaster_menuid menuid,
           var_menumaster_pagetitle menutitle,
           num_menumaster_parentmenuid parentid,
           var_menumaster_pagepath pagepath,
           num_menumaster_orderby orderby
    FROM admins.aoma_menumaster_mas
    WHERE num_menumaster_parentmenuid = 0
      AND num_menumaster_deptid = :deptId
      AND var_menumaster_pagetitle <> 'Logout'

    UNION

    SELECT num_menumaster_menuid menuid,
           var_menumaster_pagetitle menutitle,
           num_menumaster_parentmenuid parentid,
           var_menumaster_pagepath pagepath,
           num_menumaster_orderby orderby
    FROM admins.aoma_menumaster_mas
    INNER JOIN admins.aoma_MenuULB_Config
      ON num_menucorporation_menuid = num_menumaster_menuid
    INNER JOIN admins.aoma_MenuUser_Config
      ON num_menuuser_menuid = num_menumaster_menuid
    WHERE var_menuuser_activeflag = 'Y'
      AND var_menuuser_userid = :userId
      AND var_menumaster_pagepath IS NOT NULL
      AND num_menumaster_deptid = :deptId
      AND num_menucorporation_ulbid = :ulbId
      AND var_menumaster_pagetitle <> 'Logout'

    ORDER BY orderby
  `;

  const result = await executeQuery(sql, { userId, ulbId, deptId });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function lobToBuffer(lob) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    lob.on("data", (chunk) => chunks.push(chunk));
    lob.on("end", () => resolve(Buffer.concat(chunks)));
    lob.on("error", reject);
  });
}

async function getCorporationRepo({ ulbId }) {
  console.log("📤 Repo: Fetch Corporation", { ulbId });

  let connection;

  try {
    connection = await getConnection();

    const sql = `
      SELECT 
        var_corporation_name AS corporationName,
        blob_corporation_img AS corporationLogo
      FROM admins.aoma_corporation_mas
      WHERE num_corporation_id = :ulbId
    `;

    const result = await connection.execute(
      sql,
      { ulbId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows || result.rows.length === 0) {
      return [];
    }

    const row = result.rows[0];

    let logoBuffer = null;

    if (row.CORPORATIONLOGO) {
      if (Buffer.isBuffer(row.CORPORATIONLOGO)) {
        logoBuffer = row.CORPORATIONLOGO;
      } 
      else {
        logoBuffer = await lobToBuffer(row.CORPORATIONLOGO);
      }
    }

    return [
      {
        CORPORATIONNAME: row.CORPORATIONNAME,
        CORPORATIONLOGO: logoBuffer,
      },
    ];
  } catch (err) {
    console.error("❌ Repo Error:", err);
    throw err;
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

module.exports = {
  getMenusRepo,
  getCorporationRepo
};