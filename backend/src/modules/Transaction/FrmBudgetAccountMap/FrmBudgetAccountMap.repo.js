const { executeQuery } = require("../../../db/queryExecutor");
const oracledb = require("oracledb");
const { withTx } = require("../../../db/tx");

const getBudgetAccountMap = async (params) => {
  try {
    let query = "";
    let bindParams = {
      UlbId: params.ulbId
    };

    // ================= CASE 1: HEAD selected =================
    if (
      params.headId &&
      params.headId !== "0" &&
      (!params.subHeadId || params.subHeadId === "0") &&
      (!params.groupId || params.groupId === "") &&
      (!params.subGroupId || params.subGroupId === "")
    ) {
      query = `
        SELECT  
          num_budgetaccmap_id,
          num_budgetaccmap_subgroup,
          num_budgetaccmap_glcode,
          num_budgetaccmap_accountno,
          var_budgetaccmap_remark,
          num_budgetaccmap_budgetprov,
          num_budgetaccmap_revisedamt,
          num_budgetaccmap_glcode || '-' || glname AS glname,
          num_budgetaccmap_accountno || '-' || accname AS accname,
          num_budgetaccmap_srno,
          functioncode || '-' || glname AS functioncode,
          accountsearchname
        FROM aoac_budgetaccmap_det
        INNER JOIN accountview_web 
          ON num_budgetaccmap_glcode = glcode 
          AND num_budgetaccmap_accountno = accno 
          AND num_budgetaccmap_ulbid = ulbid
        WHERE 
          num_budgetaccmap_subgroup = :HeadId
          AND num_budgetaccmap_ulbid = :UlbId
      `;

      bindParams.HeadId = params.headId;
    }

    // ================= CASE 2: SUBGROUP selected =================
    else if (
      params.subGroupId &&
      params.subGroupId !== "0" &&
      params.subGroupId !== ""
    ) {
      query = `
        SELECT  
          num_budgetaccmap_id,
          num_budgetaccmap_subgroup,
          num_budgetaccmap_glcode,
          num_budgetaccmap_accountno,
          var_budgetaccmap_remark,
          num_budgetaccmap_budgetprov,
          num_budgetaccmap_revisedamt,
          num_budgetaccmap_glcode || '-' || glname AS glname,
          num_budgetaccmap_accountno || '-' || accname AS accname,
          num_budgetaccmap_srno,
          functioncode || '-' || glname AS functioncode,
          accountsearchname
        FROM aoac_budgetaccmap_det
        INNER JOIN accountview_web 
          ON num_budgetaccmap_glcode = glcode 
          AND num_budgetaccmap_accountno = accno 
          AND num_budgetaccmap_ulbid = ulbid
        WHERE 
          num_budgetaccmap_subgroup = :SubGroupId
          AND num_budgetaccmap_ulbid = :UlbId
      `;

      bindParams.SubGroupId = params.subGroupId;
    }

    // ================= INVALID =================
    else {
      throw new Error("Please select sub-group");
    }

    return await executeQuery(query, bindParams);

  } catch (err) {
    throw err;
  }
};


// ================= SUB HEAD =================
const getSubHeadList = async (headId) => {
  const query = `
    SELECT 
      var_budgetconfig_budgetname,
      num_budgetconfig_headid
    FROM aoac_budgetconfig_det
    WHERE 
      num_budgetconfig_parentid = :HeadId
      AND num_budgetconfig_level = 2
  `;

  return await executeQuery(query, { HeadId: headId });
};

// ================= GROUP =================
const getGroupList = async (subHeadId) => {
  const query = `
    SELECT 
      var_budgetconfig_budgetname,
      num_budgetconfig_headid
    FROM aoac_budgetconfig_det
    WHERE 
      num_budgetconfig_parentid = :SubHeadId
      AND num_budgetconfig_level = 3
  `;

  return await executeQuery(query, { SubHeadId: subHeadId });
};

// ================= SUB GROUP =================
const getSubGroupList = async (groupId) => {
  const query = `
    SELECT 
      var_budgetconfig_budgetname,
      num_budgetconfig_headid
    FROM aoac_budgetconfig_det
    WHERE 
      num_budgetconfig_parentid = :GroupId
      AND num_budgetconfig_level = 4
  `;

  return await executeQuery(query, { GroupId: groupId });
};

const insertBudgetAccountMap = (userId, subGroupId, paramStr, ulbId) =>
  withTx(async (connection) => {

    console.log("Repo received:", { userId, subGroupId, paramStr, ulbId });

    const result = await connection.execute(
      `BEGIN
          aoac_budgetmap_ins(
            :In_UserId,
            :In_SubGroupId,
            :In_ParamStr,
            :in_ulbid,
            :out_ErrorCode,
            :out_ErrorMsg
          );
       END;`,
      {
        In_UserId: userId || null,
        In_SubGroupId: Number(subGroupId),
        In_ParamStr: paramStr,
        in_ulbid: Number(ulbId),

        out_ErrorCode: {
          dir: oracledb.BIND_OUT,
          type: oracledb.NUMBER,
        },
        out_ErrorMsg: {
          dir: oracledb.BIND_OUT,
          type: oracledb.STRING,
          maxSize: 1000,
        },
      }
    );

    console.log("Repo Raw Result:", result);

    // ✅ IMPORTANT FIX HERE
    const response = {
      errorCode: result.outBinds.out_ErrorCode,
      message: result.outBinds.out_ErrorMsg,
    };

    console.log("Repo Return:", response);

    return response;   // ✅ MUST RETURN THIS
  });

module.exports = { getBudgetAccountMap, getSubHeadList, getGroupList, getSubGroupList , insertBudgetAccountMap};