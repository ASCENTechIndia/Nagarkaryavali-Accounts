const { executeQuery } = require("../../../db/queryExecutor");

async function getFrmBulkReceiptRepo({
  challanNo,
  deptId,
  ulbId,
}) {
  console.log("📤 Repo: Fetch FrmBulkReceipt", {
    challanNo,
    deptId,
    ulbId,
  });

  const sql = `
    SELECT 
        glcode,
        glname,
        accno,
        accountname,
        SUM(NVL(credit, 0)) AS credit,
        discount
    FROM (
        SELECT 
            functioncode AS glcode,
            objectcode AS accno,
            num_depttrnsdet_amountcr AS credit,
            0 AS discount,
            glname AS glname,
            accname AS accountname
        FROM vw_depttrans
        INNER JOIN accountview_web 
            ON accno = num_depttrnsdet_majorcode || num_depttrnsdet_minorcode
            AND glcode = num_depttrnsdet_majorcode
            AND ulbid = num_depttrns_ulbid
        WHERE var_depttrns_chalanno = :challanNo
            AND num_depttrns_deptid = :deptId
            AND num_depttrns_ulbid = :ulbId
            AND num_depttrnsdet_amountcr <> 0
            AND var_depttrns_statusflag = 'A'
            AND objectcode NOT IN (
                SELECT var_bulkreceipt_accno
                FROM aoac_bulkreceipt_mas
                WHERE var_bulkreceipt_glcode = glcode
                    AND var_bulkreceipt_chalonno = var_depttrns_chalanno
            )
    )
    GROUP BY 
        glcode,
        accno,
        discount,
        glname,
        accountname
    ORDER BY 
        glcode,
        accno
  `;

  const binds = {
    challanNo,
    deptId,
    ulbId,
  };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function searchBulkReceiptAccountRepo({
  glcode,
  accno,
  ulbid,
}) {
  console.log(
    "📤 Repo: Search Bulk Receipt Account",
    {
      glcode,
      accno,
      ulbid,
    }
  );

  const conditions = [];
  const binds = {};

  conditions.push("ulbid = :ulbid");

  binds.ulbid = ulbid;

  // GL CODE PREFIX SEARCH
  if (glcode) {
    conditions.push(
      "TO_CHAR(glcode) LIKE :glcode"
    );

    binds.glcode = `${glcode}%`;
  }

  // ACCOUNT NO PREFIX SEARCH
   if (accno) {
    conditions.push(
      "TO_CHAR(accno) LIKE :accno"
    );
    binds.accno = `${accno}%`;
  }

  const sql = `
    SELECT 
        glcode,
        glname,
        accno,
        accname AS accountname
    FROM accountview_web
    WHERE ${conditions.join(" AND ")}
    ORDER BY glcode, accno
  `;

  console.log("Final SQL =>", sql);

  console.log("Final Binds =>", binds);

  const result = await executeQuery(
    sql,
    binds
  );

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

const bulkreceiptInsertUpdateRepo = async (data) => {
  try {
    const result = await withTx(async (conn) => {

      const res = await conn.execute(
        `BEGIN 
            aoac_receipt_bulk_ins(
              :In_UserId,
              :In_ParamStr,
              :In_ParamStr2,
              :In_ParamStr3,
              :In_ParamStr4,
              :In_ParamStr5,
              :In_ParamStr6,
              :out_ReturnStr,
              :out_ErrorCode,
              :out_ErrorMsg
            );
         END;`,
        {
          In_UserId: data.In_UserId,
          In_ParamStr: data.In_ParamStr,
          In_ParamStr2: data.In_ParamStr2,
          In_ParamStr3: data.In_ParamStr3 || null,
          In_ParamStr4: data.In_ParamStr4 || null,
          In_ParamStr5: data.In_ParamStr5 || null,
          In_ParamStr6: data.In_ParamStr6 || null,

          out_ReturnStr: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 500
          },
          out_ErrorCode: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER
          },
          out_ErrorMsg: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 2000
          }
        }
      );

      return res.outBinds;
    });

    return {
      success: true,
      ...result
    };

  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
};

module.exports = {
  getFrmBulkReceiptRepo,
  searchBulkReceiptAccountRepo,
  bulkreceiptInsertUpdateRepo
};