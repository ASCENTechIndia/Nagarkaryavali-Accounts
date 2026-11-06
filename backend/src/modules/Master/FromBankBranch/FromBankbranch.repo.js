const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");

// 1. Bank List
async function getBankList() {
  const sql = `
    SELECT 
      num_bankmst_bankid AS value,
      var_bankmst_bankname AS label
    FROM aoac_bankmst_def
    ORDER BY var_bankmst_bankname
  `;

  const result = await executeQuery(sql);
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 2. Branch List by Bank
async function getBranchList(bankId) {
  const sql = `
    SELECT 
      br.num_branchmst_branchid,
      br.num_branchmst_bankid,
      br.var_branchmst_branchname,
      b.var_bankmst_bankname,
      br.var_branchmst_insby,
      br.var_branchmst_updby,
      br.var_branchmst_micr,
      br.var_branchmst_ifsc,
      br.var_branchmst_address,
      br.var_branchmst_rajya,
      br.var_branchmst_jila,
      br.var_branchmst_sahar,
      br.num_branchmst_pincode
    FROM aoac_branchmst_def br
    JOIN aoac_bankmst_def b 
      ON br.num_branchmst_bankid = b.num_bankmst_bankid
    WHERE b.num_bankmst_bankid = :bankId
    ORDER BY UPPER(br.var_branchmst_branchname)
  `;

  const result = await executeQuery(sql, { bankId });
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 3. Branch By ID
async function getBranchById(branchId) {
  const sql = `
    SELECT 
      num_branchmst_branchid AS Branchid,
      num_branchmst_bankid AS BankId,
      var_branchmst_branchname AS Branchname,
      var_branchmst_micr AS micr,
      var_branchmst_ifsc AS ifsc,
      var_branchmst_address AS branchAddress,
      var_branchmst_rajya AS state,
      var_branchmst_jila AS district,
      var_branchmst_sahar AS city,
      num_branchmst_pincode AS branchMobile
    FROM aoac_branchmst_def
    WHERE num_branchmst_branchid = :branchId
  `;

  const result = await executeQuery(sql, { branchId });
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 4. Procedure
async function bankBranchProc(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN 
          aoac_bankbranch_ins_kjt(
            :in_bankid,
            :in_branchid,
            :in_branchname,
            :in_UserId,
            :in_Mode,
            :in_micr,
            :in_ifsc,
            :in_address,
            :IN_rajya,
            :IN_jila,
            :IN_sahar,
            :IN_pincode,
            :out_ErrorCode,
            :out_ErrorMsg
          );
        END;`,
        {
          in_bankid: data.bankId,
          in_branchid: data.branchId || null,
          in_branchname: data.branchName,
          in_UserId: data.userId,
          in_Mode: data.mode,
          in_micr: data.micr || null,
          in_ifsc: data.ifsc || null,
          in_address:data.branchAddress,
          IN_rajya: data.state,
          IN_jila: data.district ,
          IN_sahar: data.city ,
          IN_pincode: data.branchMobileNo,

          out_ErrorCode: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER,
          },
          out_ErrorMsg: {
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
  getBankList,
  getBranchList,
  getBranchById,
  bankBranchProc,
};