const { executeQuery } = require("../../../db/queryExecutor");

const getReceiptRegister = async (params) => {
  try {
    let query = "";

    let bindParams = {
      FromDate: params.fromDate,
      ToDate: params.toDate,
      UlbId: params.ulbId,
      department: params.department,
    };

    // ================= DETAIL REPORT =================
    if (params.rptType === "1") {
      query = `
    SELECT
      a.trnsdate,
      a.glcode,
      acc.glname,
      a.accno,
      acc.accname,
      vz.zoneename,
      acc.functioncode,
      acc.objectcode,
      ${params.chkGramPanchayat ? "var_grampanch_grampanch" : "NULL"} AS grampanch,
      SUM(a.amount) amount,
      0 BudgetCode
    FROM transview a
    INNER JOIN accountview_web acc
      ON a.glcode = acc.glcode
      AND a.accno = acc.accno
      AND acc.ulbid = a.ulbid
      INNER JOIN aoac_receiptmst_def
              ON num_receiptmst_trnsno = a.transno
             AND num_receiptmst_ulbid = a.ulbid
   INNER JOIN aoac_receiptdet_def rd
       ON rd.num_receiptdet_refno = aoac_receiptmst_def.num_receiptmst_refno
    LEFT JOIN view_zone vz
      ON vz.zoneid = a.zoneid
    LEFT JOIN aoac_grampanch_def
      ON num_grampanch_grampanchid = a.grampanchid
    LEFT JOIN aoac_partymst_def
      ON num_partymst_partyid = a.partycode
    WHERE
      a.trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
      AND a.trnsdate < TO_DATE(:ToDate,'YYYY-MM-DD') + 1
      AND a.amount > 0
      AND a.trnstypeid IN (1,2)
      AND aoac_receiptmst_def.num_receiptmst_deptid = :department
  `;

      if (params.majorCode && params.majorCode !== "-1" && !params.minorCode) {
        query += ` AND a.glcode = :MajorCode`;
        bindParams.MajorCode = params.majorCode;
      }

      if (
        params.majorCode &&
        params.majorCode !== "-1" &&
        params.minorCode &&
        params.minorCode !== "-1"
      ) {
        query += ` AND acc.functioncode = :MajorCode
               AND acc.objectcode = :MinorCode`;

        bindParams.MajorCode = params.majorCode;
        bindParams.MinorCode = params.minorCode;
      }

      if (params.zoneId && params.zoneId !== "-1") {
        query += ` AND a.zoneid = :ZoneId`;
        bindParams.ZoneId = params.zoneId;
      }

      if (params.grampanchayatId && params.grampanchayatId !== "-1") {
        query += ` AND a.grampanchid = :GramId`;
        bindParams.GramId = params.grampanchayatId;
      }

      if (params.userId && params.userId !== "0") {
        query += ` AND a.insby = :UserId`;
        bindParams.UserId = params.userId;
      }

      if (params.budgetId && params.budgetId !== "-1") {
        query += ` AND a.budgetid = :BudgetId`;
        bindParams.BudgetId = params.budgetId;
      }

      if (params.nidhiId && params.nidhiId !== "-1") {
        query += ` AND a.nidhi_id = :NidhiId`;
        bindParams.NidhiId = params.nidhiId;
      }

      query += `
    AND a.ulbid = :UlbId
    GROUP BY
      a.trnsdate,
      a.glcode,
      acc.glname,
      acc.functioncode,
      a.accno,
      acc.objectcode,
      acc.accname,
      vz.zoneename
      ${params.chkGramPanchayat ? ", var_grampanch_grampanch" : ""}
    ORDER BY
      a.trnsdate
  `;
    }

    // ================= SUMMARY REPORT =================
    else {
      query = `
    SELECT
      a.accno,
      acc.accname,
      SUM(a.amount) amount
    FROM transview a
    INNER JOIN accountview_web acc
      ON a.glcode = acc.glcode
      AND a.accno = acc.accno
      AND acc.ulbid = a.ulbid
      INNER JOIN aoac_receiptmst_def
              ON num_receiptmst_trnsno = a.transno
             AND num_receiptmst_ulbid = a.ulbid
 INNER JOIN aoac_receiptdet_def rd
       ON rd.num_receiptdet_refno = aoac_receiptmst_def.num_receiptmst_refno
    LEFT JOIN view_zone vz
      ON vz.zoneid = a.zoneid
    LEFT JOIN aoac_grampanch_def
      ON num_grampanch_grampanchid = a.grampanchid
    LEFT JOIN aoac_partymst_def
      ON num_partymst_partyid = a.partycode
    WHERE
      a.trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
      AND a.trnsdate < TO_DATE(:ToDate,'YYYY-MM-DD') + 1
      AND a.amount > 0
      AND a.trnstypeid IN (1,2)
      AND aoac_receiptmst_def.num_receiptmst_deptid = :department
  `;

      if (params.majorCode && params.majorCode !== "-1" && !params.minorCode) {
        query += ` AND a.glcode = :MajorCode`;
        bindParams.MajorCode = params.majorCode;
      }

      if (
        params.majorCode &&
        params.majorCode !== "-1" &&
        params.minorCode &&
        params.minorCode !== "-1"
      ) {
        query += ` AND acc.functioncode = :MajorCode
               AND acc.objectcode = :MinorCode`;

        bindParams.MajorCode = params.majorCode;
        bindParams.MinorCode = params.minorCode;
      }

      if (params.zoneId && params.zoneId !== "-1") {
        query += ` AND a.zoneid = :ZoneId`;
        bindParams.ZoneId = params.zoneId;
      }

      if (params.grampanchayatId && params.grampanchayatId !== "-1") {
        query += ` AND a.grampanchid = :GramId`;
        bindParams.GramId = params.grampanchayatId;
      }

      if (params.userId && params.userId !== "0") {
        query += ` AND a.insby = :UserId`;
        bindParams.UserId = params.userId;
      }

      if (params.budgetId && params.budgetId !== "-1") {
        query += ` AND a.budgetid = :BudgetId`;
        bindParams.BudgetId = params.budgetId;
      }

      if (params.nidhiId && params.nidhiId !== "-1") {
        query += ` AND a.nidhi_id = :NidhiId`;
        bindParams.NidhiId = params.nidhiId;
      }

      query += `
    AND a.ulbid = :UlbId
    GROUP BY
      a.accno,
      acc.accname
    ORDER BY
      a.accno
  `;
    }

    return await executeQuery(query, bindParams);

  } catch (err) {
    throw err;
  }
};
const getReceiptRegisterUserWise = async (params) => {
  try {
    const bindParams = {
      FromDate: params.fromDate,
      ToDate: params.toDate,
      UlbId: params.ulbId,
      department: params.department,
    };

    let query = `
      SELECT
          trnsdate,
          userid,
          glcode,
          glname,
          accno,
          accname,
          zoneename,
          functioncode,
          objectcode,
          grampanch,
          SUM(amount) amount,
          BudgetCode,
          SUM(discountamount) discountamount
      FROM
      (
          SELECT
              a.trnsdate,
              a.insby AS userid,
              a.glcode,
              acc.glname,
              a.accno,
              acc.accname,
              vz.zoneename,
              acc.functioncode,
              acc.objectcode,
              NULL AS grampanch,
              SUM(a.amount) AS amount,
              0 AS BudgetCode,

              NVL(
                  (
                      SELECT SUM(num_receiptdesc_amount)
                      FROM aoac_receiptdesc_def rd
                      WHERE rd.num_receiptdesc_refno = num_receiptmst_refno
                  ),
                  0
              ) AS discountamount

          FROM transview a

          INNER JOIN accountview_web acc
              ON a.glcode = acc.glcode
             AND a.accno = acc.accno
             AND acc.ulbid = a.ulbid

          INNER JOIN aoac_receiptmst_def
              ON num_receiptmst_trnsno = a.transno
             AND num_receiptmst_ulbid = a.ulbid

          INNER JOIN aoac_receiptdet_def rd
       ON rd.num_receiptdet_refno = aoac_receiptmst_def.num_receiptmst_refno

          LEFT JOIN view_zone vz
              ON vz.zoneid = a.zoneid

          LEFT JOIN aoac_grampanch_def
              ON num_grampanch_grampanchid = a.grampanchid

          LEFT JOIN aoac_partymst_def
              ON num_partymst_partyid = a.partycode

          WHERE a.trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
            AND a.trnsdate < TO_DATE(:ToDate,'YYYY-MM-DD') + 1
            AND a.amount > 0
            AND a.trnstypeid IN (1,2)
            AND a.ulbid = :UlbId
           AND aoac_receiptmst_def.num_receiptmst_deptid = :department
    `;

    if (params.userId && params.userId !== "0") {
      query += ` AND a.insby = :UserId `;
      bindParams.UserId = params.userId;
    }

    if (params.zoneId && params.zoneId !== "-1") {
      query += ` AND a.zoneid = :ZoneId `;
      bindParams.ZoneId = params.zoneId;
    }

    if (params.budgetId && params.budgetId !== "-1") {
      query += ` AND a.budgetid = :BudgetId `;
      bindParams.BudgetId = params.budgetId;
    }

    if (params.nidhiId && params.nidhiId !== "-1") {
      query += ` AND a.nidhi_id = :NidhiId `;
      bindParams.NidhiId = params.nidhiId;
    }

    query += `
          GROUP BY
              a.trnsdate,
              a.insby,
              a.glcode,
              acc.glname,
              a.accno,
              acc.accname,
              vz.zoneename,
              acc.functioncode,
              acc.objectcode,
              num_receiptmst_refno
      )
      GROUP BY
          trnsdate,
          userid,
          glcode,
          glname,
          accno,
          accname,
          zoneename,
          functioncode,
          objectcode,
          grampanch,
          BudgetCode

      ORDER BY
          trnsdate,
          userid,
          glcode,
          accno
    `;

    return await executeQuery(query, bindParams);

  } catch (err) {
    throw err;
  }
};


const getReceiptRegisterProperty = async (params) => {
  try {
    const bindParams = {
      FromDate: params.fromDate,
      ToDate: params.toDate,
      UlbId: params.ulbId,
    };

    let query = `
      SELECT
        trnsdate,
        userid,
        glcode,
        glname,
        accno,
        accname,
        zoneename,
        functioncode,
        objectcode,
        grampanch,
        SUM(amount) amount,
        BudgetCode,

        SUM(discount_91028290001) discount_91028290001,
        SUM(discount_91028290003) discount_91028290003

    FROM
    (
        SELECT
            a.trnsdate,
            a.insby AS userid,
            a.glcode,
            acc.glname,
            a.accno,
            acc.accname,
            vz.zoneename,
            acc.functioncode,
            acc.objectcode,
            NULL AS grampanch,
            SUM(a.amount) AS amount,
            0 AS BudgetCode,

            NVL(
                (
                    SELECT SUM(rd.num_receiptdesc_amount)
                    FROM aoac_receiptdesc_def rd
                    WHERE rd.num_receiptdesc_refno = num_receiptmst_refno
                      AND rd.num_receiptdesc_accno = '91028290001'
                ),
                0
            ) AS discount_91028290001,

            NVL(
                (
                    SELECT SUM(rd.num_receiptdesc_amount)
                    FROM aoac_receiptdesc_def rd
                    WHERE rd.num_receiptdesc_refno = num_receiptmst_refno
                      AND rd.num_receiptdesc_accno = '91028290004'
                ),
                0
            ) AS discount_91028290003

        FROM transview a

        INNER JOIN accountview_web acc
            ON a.glcode = acc.glcode
          AND a.accno = acc.accno
          AND acc.ulbid = a.ulbid

        INNER JOIN aoac_receiptmst_def rmst
            ON rmst.num_receiptmst_trnsno = a.transno
          AND rmst.num_receiptmst_ulbid = a.ulbid

        LEFT JOIN view_zone vz
            ON vz.zoneid = a.zoneid

        LEFT JOIN aoac_grampanch_def gp
            ON gp.num_grampanch_grampanchid = a.grampanchid

        LEFT JOIN aoac_partymst_def pm
            ON pm.num_partymst_partyid = a.partycode

          WHERE a.trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
            AND a.trnsdate < TO_DATE(:ToDate,'YYYY-MM-DD') + 1
            AND a.amount > 0
            AND a.trnstypeid IN (1,2)
            AND a.ulbid = :UlbId
    `;

    if (params.userId && params.userId !== "0") {
      query += ` AND a.insby = :UserId `;
      bindParams.UserId = params.userId;
    }

    if (params.zoneId && params.zoneId !== "-1") {
      query += ` AND a.zoneid = :ZoneId `;
      bindParams.ZoneId = params.zoneId;
    }

    if (params.budgetId && params.budgetId !== "-1") {
      query += ` AND a.budgetid = :BudgetId `;
      bindParams.BudgetId = params.budgetId;
    }

    if (params.nidhiId && params.nidhiId !== "-1") {
      query += ` AND a.nidhi_id = :NidhiId `;
      bindParams.NidhiId = params.nidhiId;
    }

    query += `
          GROUP BY
              a.trnsdate,
              a.insby,
              a.glcode,
              acc.glname,
              a.accno,
              acc.accname,
              vz.zoneename,
              acc.functioncode,
              acc.objectcode,
              num_receiptmst_refno
      )
      GROUP BY
          trnsdate,
          userid,
          glcode,
          glname,
          accno,
          accname,
          zoneename,
          functioncode,
          objectcode,
          grampanch,
          BudgetCode

      ORDER BY
          trnsdate,
          userid,
          glcode,
          accno
    `;

    return await executeQuery(query, bindParams);

  } catch (err) {
    throw err;
  }
};
module.exports = { getReceiptRegister , getReceiptRegisterUserWise, getReceiptRegisterProperty};
