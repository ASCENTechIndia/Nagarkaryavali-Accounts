const { executeQuery } = require("../../../db/queryExecutor"); // adjust path

const getGovtTaxPayment = async (params) => {
    try {

        // 🔹 Build IN clause safely (numbers only)
        const taxAccArray = params.taxAccno.split(",").map(Number);
        const taxAccList = taxAccArray.join(",");

        let query = `
            SELECT * FROM 
            (
                SELECT 
                    acc.functioncode glcode,
                    acc.objectcode accno,
                    accname,
                    num_govttax_trnsno trnsno,
                    num_govttax_trnsdate trnsdate,
                    num_govttax_partyid partyid,
                    var_partymst_partyname partyname,
                    num_govttax_billamt billamt,
                    num_govttax_taxamt taxamt,
                    var_ratemst_ratename rate,
                    var_sectionmst_sectionname section,
                    (SELECT DISTINCT chqno FROM transview a WHERE num_govttax_trnsno = transno) Chqno,
                    num_govttax_balamt balamt
                FROM aoac_govttax_def
                LEFT JOIN aoac_partymst_def 
                    ON num_partymst_partyid = num_govttax_partyid
                INNER JOIN accountview_web acc 
                    ON acc.glcode = num_govttax_glcode 
                    AND acc.accno = num_govttax_accno 
                    AND acc.ulbid = num_govttax_ulbid
                LEFT OUTER JOIN aoac_ratemst_def 
                    ON num_ratemst_rateid = num_govttax_rate
                LEFT OUTER JOIN aoac_sectionmst_def 
                    ON num_sectionmst_sectionid = num_govttax_sectionid
                WHERE 
                    num_govttax_glcode = :GlCode
                    AND num_govttax_accno IN (${taxAccList})
                    AND TRUNC(num_govttax_trnsdate) >= TO_DATE(:FromDate,'YYYY-MM-DD')
                    AND TRUNC(num_govttax_trnsdate) <= TO_DATE(:ToDate,'YYYY-MM-DD')
                    AND num_govttax_ulbid = :UlbId
                    AND num_govttax_balamt > 0

                UNION

                SELECT 
                    acc.functioncode glcode,
                    acc.objectcode accno,
                    accname,
                    num_govttax_trnsno trnsno,
                    num_govttax_trnsdate trnsdate,
                    num_govttax_partyid partyid,
                    var_partymst_partyname partyname,
                    num_govttax_billamt billamt,
                    num_govttax_taxamt taxamt,
                    var_ratemst_ratename rate,
                    var_sectionmst_sectionname section,
                    (SELECT DISTINCT chqno FROM transview a WHERE num_govttax_trnsno = transno) Chqno,
                    num_govttax_taxamt balamt
                FROM aoac_govttax_def
                LEFT JOIN aoac_partymst_def 
                    ON num_partymst_partyid = num_govttax_partyid
                INNER JOIN accountview_web acc 
                    ON acc.glcode = num_govttax_glcode 
                    AND acc.accno = num_govttax_accno 
                    AND acc.ulbid = num_govttax_ulbid
                LEFT OUTER JOIN aoac_ratemst_def 
                    ON num_ratemst_rateid = num_govttax_rate
                LEFT OUTER JOIN aoac_sectionmst_def 
                    ON num_sectionmst_sectionid = num_govttax_sectionid
                WHERE 
                    num_govttax_glcode = :GlCode
                    AND num_govttax_accno IN (${taxAccList})
                    AND TRUNC(num_govttax_trnsdate) >= TO_DATE(:FromDate,'YYYY-MM-DD')
                    AND TRUNC(num_govttax_trnsdate) <= TO_DATE(:ToDate,'YYYY-MM-DD')
                    AND num_govttax_paytrnsno IS NULL
                    AND num_govttax_paytrnsdate IS NULL
                    AND num_govttax_patchalanno IS NULL
                    AND num_govttax_ulbid = :UlbId
                    AND num_govttax_balamt IS NULL
            )
            ORDER BY trnsno, partyid, glcode, accno
        `;

        const bindParams = {
            GlCode: params.glCode,     // 👈 dynamic like .NET
            FromDate: params.fromDate,
            ToDate: params.toDate,
            UlbId: params.ulbId
        };

        return await executeQuery(query, bindParams);

    } catch (error) {
        throw error;
    }
};

const govtTaxInsert = async (userId, refNo, trnsSourceId, trnsStatus, str1, str2) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `BEGIN
         aoac_trns_ins(
            :In_RefNo,
            :In_TrnsSourceId,
            :In_TrnsStatus,
            :In_Str1,
            :In_Str2,
            :In_UserId,
            :out_ErrorCode,
            :out_ErrorMsg
         );
       END;`,
      {
        In_RefNo: refNo || null,
        In_TrnsSourceId: trnsSourceId || null,
        In_TrnsStatus: trnsStatus || null,
        In_Str1: str1 || null,
        In_Str2: str2 || null,
        In_UserId: userId || null,

        out_ErrorCode: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        out_ErrorMsg: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 900 }
      }
    );

    return {
      errorCode: result.outBinds.out_ErrorCode,
      message: result.outBinds.out_ErrorMsg
    };

  } finally {
    if (connection) await connection.close();
  }
};





module.exports = {
    getGovtTaxPayment, govtTaxInsert
};