const { executeQuery } = require("../../../db/queryExecutor");
const oracledb = require("oracledb");
const { withTx } = require("../../../db/tx");

const getTransactionList = async (params) => {
  try {
    let query = "";
    let bindParams = {
      FromDate: params.fromDate,
      ToDate: params.toDate,
      UlbId: params.ulbId,
      loginUser: params.loginUser
    };

    // ================= RECEIPT =================
//     if (params.transType === "1") {
//       query = `
//         SELECT
//     rmst.num_receiptmst_refno AS refno,
//     rmst.date_receiptmst_trnsdate AS trnsdate,
//     tt.var_trnstype_trnstypemar AS trnstype,
//     vz.zoneename AS zonename,
//     gp.var_grampanch_marathiname AS grampanch,
//    SUM(num_receiptdet_amount) - MAX(NVL(num_receiptdesc_amount,0)) amount,
//     rmst.var_receiptmst_insby AS username,
//     rmst.date_receiptmst_insdate AS datetime,
//     rmst.num_receiptmst_trnstypeid AS trnstypeid,
//     pmst.var_partymst_partyname AS PartyName,

//     -- Extra GL details (will show values if match exists, otherwise NULL)
//     a.glcode,
//     acc.glname,
//     a.accno,
//     acc.accname,
//     acc.functioncode,
//     acc.objectcode,
//     0 AS BudgetCode,
//     MAX(NVL(rdesc.num_receiptdesc_amount, 0)) AS discountamount

// FROM aoac_receiptmst_def rmst

// INNER JOIN aoac_receiptdet_def det
//     ON det.num_receiptdet_refno = rmst.num_receiptmst_refno

// INNER JOIN aoac_trnstype_def tt
//     ON tt.num_trnstype_trnstypeid = rmst.num_receiptmst_trnstypeid

// LEFT JOIN view_zone vz
//     ON vz.zoneid = rmst.num_receiptmst_zoneid

// LEFT JOIN aoac_partymst_def pmst
//     ON pmst.num_partymst_partyid = det.num_receiptdet_partycode

// LEFT JOIN aoac_grampanch_def gp
//     ON gp.num_grampanch_deptid = rmst.num_receiptmst_zoneid
//    AND gp.num_grampanch_grampanchid = rmst.num_receiptmst_grampanchid

// -- FIXED: Changed from INNER JOIN to LEFT JOIN so your core data is not dropped
// LEFT JOIN transview a
//     ON rmst.num_receiptmst_trnsno = a.transno
//    AND rmst.num_receiptmst_ulbid = a.ulbid

// -- FIXED: Changed to LEFT JOIN to match the transview layer safely
// LEFT JOIN accountview_web acc
//     ON a.glcode = acc.glcode
//    AND a.accno = acc.accno
//    AND acc.ulbid = a.ulbid

// LEFT JOIN aoac_receiptdesc_def rdesc
//     ON rdesc.num_receiptdesc_refno = rmst.num_receiptmst_refno
//         WHERE 
//           rmst.date_receiptmst_trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
//           AND rmst.date_receiptmst_trnsdate < TO_DATE(:ToDate,'YYYY-MM-DD') + 1
//           AND rmst.var_receiptmst_authstatus IS NULL
//           AND rmst.num_receiptmst_ulbid = :UlbId
//       `;

//       if (params.zoneId && params.zoneId !== "-1") {
//         query += ` AND rmst.num_receiptmst_zoneid = :ZoneId`;
//         bindParams.ZoneId = params.zoneId;
//       }

//       if (params.budgetId && params.budgetId !== "0") {
//         query += ` AND rmst.num_receiptmst_budget_id = :BudgetId`;
//         bindParams.BudgetId = params.budgetId;
//       }

//       if (params.userId && params.userId !== "0") {
//         query += ` AND rmst.var_receiptmst_insby = :UserId`;
//         bindParams.UserId = params.userId;
//       }

//       if (params.nidhiId && params.nidhiId !== "0") {
//         query += ` AND rmst.num_receiptmst_nidhi_id = :NidhiId`;
//         bindParams.NidhiId = params.nidhiId;
//       }

//       query += `
//         GROUP BY
//     rmst.num_receiptmst_refno,
//     rmst.date_receiptmst_trnsdate,
//     tt.var_trnstype_trnstypemar,
//     vz.zoneename,
//     gp.var_grampanch_marathiname,
//     rmst.var_receiptmst_insby,
//     rmst.date_receiptmst_insdate,
//     rmst.num_receiptmst_trnstypeid,
//     pmst.var_partymst_partyname,
//     a.glcode,
//     acc.glname,
//     a.accno,
//     acc.accname,
//     acc.functioncode,
//     acc.objectcode

// ORDER BY
//     rmst.date_receiptmst_trnsdate,
//     rmst.num_receiptmst_refno
//       `;
//     }

    if (params.transType === "-1") {

      const transactionTypes = ["1", "2", "5", "8", "9"];

      const results = await Promise.all(
        transactionTypes.map((transType) =>
          getTransactionList({
            ...params,
            transType,
          })
        )
      );

      const allRows = results.flatMap(
        (result) => result?.rows || []
      );

      allRows.sort((a, b) => {
        const dateA = new Date(a.TRNSDATE || a.trnsdate);
        const dateB = new Date(b.TRNSDATE || b.trnsdate);

        return dateA - dateB;
      });

      return {
        success: true,
        rows: allRows,
      };
    }

    if (params.transType === "1") {
      query = `
        SELECT
            rmst.num_receiptmst_refno AS refno,
            rmst.date_receiptmst_trnsdate AS trnsdate,
            tt.var_trnstype_trnstypemar AS trnstype,
            vz.zoneename AS zonename,
            gp.var_grampanch_marathiname AS grampanch,

            NVL(det.total_amount, 0) - NVL(rdesc.discount_amount, 0) AS amount,

            rmst.var_receiptmst_insby AS username,
            rmst.date_receiptmst_insdate AS datetime,
            rmst.num_receiptmst_trnstypeid AS trnstypeid,
            pmst.var_partymst_partyname AS PartyName,

            a.glcode,
            acc.glname,
            a.accno,
            acc.accname,
            acc.functioncode,
            acc.objectcode,

            0 AS BudgetCode,

            NVL(rdesc.discount_amount, 0) AS discountamount

        FROM aoac_receiptmst_def rmst

        LEFT JOIN (
            SELECT
                num_receiptdet_refno,
                SUM(num_receiptdet_amount) AS total_amount,
                MAX(num_receiptdet_partycode) AS partycode
            FROM aoac_receiptdet_def
            GROUP BY num_receiptdet_refno
        ) det
            ON det.num_receiptdet_refno = rmst.num_receiptmst_refno

        LEFT JOIN (
            SELECT
                num_receiptdesc_refno,
                SUM(num_receiptdesc_amount) AS discount_amount
            FROM aoac_receiptdesc_def
            GROUP BY num_receiptdesc_refno
        ) rdesc
            ON rdesc.num_receiptdesc_refno = rmst.num_receiptmst_refno

        INNER JOIN aoac_trnstype_def tt
            ON tt.num_trnstype_trnstypeid = rmst.num_receiptmst_trnstypeid

        LEFT JOIN view_zone vz
            ON vz.zoneid = rmst.num_receiptmst_zoneid

        LEFT JOIN aoac_partymst_def pmst
            ON pmst.num_partymst_partyid = det.partycode

        LEFT JOIN aoac_grampanch_def gp
            ON gp.num_grampanch_deptid = rmst.num_receiptmst_zoneid
          AND gp.num_grampanch_grampanchid = rmst.num_receiptmst_grampanchid

        LEFT JOIN transview a
            ON rmst.num_receiptmst_trnsno = a.transno
          AND rmst.num_receiptmst_ulbid = a.ulbid

        LEFT JOIN accountview_web acc
            ON a.glcode = acc.glcode
          AND a.accno = acc.accno
          AND acc.ulbid = a.ulbid

        WHERE 
          rmst.date_receiptmst_trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
          AND rmst.date_receiptmst_trnsdate < TO_DATE(:ToDate,'YYYY-MM-DD') + 1
          AND rmst.var_receiptmst_authstatus IS NULL
          AND rmst.num_receiptmst_ulbid = :UlbId
          AND
          (
              (
                  EXISTS
                  (
                      SELECT 1
                      FROM aoac_userdept_map_config login_dept
                      WHERE login_dept.num_userdept_userid = :loginUser
                        AND login_dept.num_userdept_ulbid = :UlbId
                  )

                  AND

                  EXISTS
                  (
                      SELECT 1
                      FROM aoac_userzone_map_config login_zone
                      WHERE login_zone.num_userzone_userid = :loginUser
                        AND login_zone.num_userzone_ulbid = :UlbId
                  )

                  AND

                  EXISTS
                  (
                      SELECT 1
                      FROM aoac_userzone_map_config login_zone
                      WHERE login_zone.num_userzone_userid = :loginUser
                        AND login_zone.num_userzone_ulbid = :UlbId
                        AND login_zone.num_userzone_zoneid =
                            rmst.num_receiptmst_zoneid
                  )

                  AND

                  EXISTS
                  (
                      SELECT 1
                      FROM aoms_accusermap_mas aum
                      WHERE aum.num_accusermap_userid =
                            rmst.var_receiptmst_insby

                        AND aum.num_accusermap_deptid IN
                        (
                            SELECT login_dept.num_userdept_deptid
                            FROM aoac_userdept_map_config login_dept
                            WHERE login_dept.num_userdept_userid = :loginUser
                              AND login_dept.num_userdept_ulbid = :UlbId
                        )

                        AND aum.num_accusermap_ward IN
                        (
                            SELECT login_zone.num_userzone_zoneid
                            FROM aoac_userzone_map_config login_zone
                            WHERE login_zone.num_userzone_userid = :loginUser
                              AND login_zone.num_userzone_ulbid = :UlbId
                        )
                  )
              )

              OR
              (
                  NOT EXISTS
                  (
                      SELECT 1
                      FROM aoac_userdept_map_config login_dept
                      WHERE login_dept.num_userdept_userid = :loginUser
                        AND login_dept.num_userdept_ulbid = :UlbId
                  )

                  AND

                  NOT EXISTS
                  (
                      SELECT 1
                      FROM aoac_userzone_map_config login_zone
                      WHERE login_zone.num_userzone_userid = :loginUser
                        AND login_zone.num_userzone_ulbid = :UlbId
                  )
              )
          )
      `;

      if (params.zoneId && params.zoneId !== "-1") {
        query += ` AND rmst.num_receiptmst_zoneid = :ZoneId`;
        bindParams.ZoneId = params.zoneId;
      }

      if (params.budgetId && params.budgetId !== "0") {
        query += ` AND rmst.num_receiptmst_budget_id = :BudgetId`;
        bindParams.BudgetId = params.budgetId;
      }

      if (params.userId && (params.userId !== "0" || params.userId !== "-1")) {
        query += ` AND rmst.var_receiptmst_insby = :UserId`;
        bindParams.UserId = params.userId;
      }

      if (params.nidhiId && params.nidhiId !== "0") {
        query += ` AND rmst.num_receiptmst_nidhi_id = :NidhiId`;
        bindParams.NidhiId = params.nidhiId;
      }

      query += `
ORDER BY
    rmst.date_receiptmst_trnsdate,
    rmst.num_receiptmst_refno
      `;
    }

    // ================= PAYMENT =================
    else if (params.transType === "2") {
      query = `
        SELECT 
          num_payment_refno refno,
          date_payment_trnsdate trnsdate,
          num_payment_vchno docno,
          var_trnstype_trnstypemar trnstype,
          zoneename zonename,
          var_grampanch_marathiname grampanch,
          SUM(num_paymentdet_amount) amount,
          var_payment_insby username,
          date_payment_insdate datetime,
          num_payment_trnstype trnstypeid,
          var_partymst_partyname PartyName,
          var_budgethead_name budgetname
        FROM aoac_payment_def
        LEFT JOIN aoac_budgethead_mst 
          ON num_budget_id = num_budgethead_id
        INNER JOIN aoac_paymentdet_def 
          ON num_payment_refno = num_paymentdet_refno
        INNER JOIN aoac_trnstype_def 
          ON num_trnstype_trnstypeid = num_payment_trnstype
        INNER JOIN view_zone 
          ON zoneid = num_payment_zoneid
        LEFT JOIN aoac_partymst_def 
          ON num_partymst_partyid = num_paymentdet_partycode
        LEFT JOIN aoac_grampanch_def 
          ON num_grampanch_deptid = num_payment_zoneid 
          AND num_grampanch_grampanchid = num_payment_grampanchid
        WHERE 
            date_payment_trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
            AND date_payment_trnsdate < TO_DATE(:ToDate,'YYYY-MM-DD') + 1
          AND var_payment_authstatus IS NULL
          AND corpid = :UlbId
         AND
          (
              (
                  EXISTS
                  (
                      SELECT 1
                      FROM aoac_userdept_map_config login_dept
                      WHERE login_dept.num_userdept_userid = :loginUser
                        AND login_dept.num_userdept_ulbid = :UlbId
                  )

                  AND

                  EXISTS
                  (
                      SELECT 1
                      FROM aoac_userzone_map_config login_zone
                      WHERE login_zone.num_userzone_userid = :loginUser
                        AND login_zone.num_userzone_ulbid = :UlbId
                  )

                  AND

                  EXISTS
                  (
                      SELECT 1
                      FROM aoac_userzone_map_config login_zone
                      WHERE login_zone.num_userzone_userid = :loginUser
                        AND login_zone.num_userzone_ulbid = :UlbId
                        AND login_zone.num_userzone_zoneid =
                            rmst.num_receiptmst_zoneid
                  )

                  AND

                  EXISTS
                  (
                      SELECT 1
                      FROM aoms_accusermap_mas aum
                      WHERE aum.num_accusermap_userid =
                            rmst.var_receiptmst_insby

                        AND aum.num_accusermap_deptid IN
                        (
                            SELECT login_dept.num_userdept_deptid
                            FROM aoac_userdept_map_config login_dept
                            WHERE login_dept.num_userdept_userid = :loginUser
                              AND login_dept.num_userdept_ulbid = :UlbId
                        )

                        AND aum.num_accusermap_ward IN
                        (
                            SELECT login_zone.num_userzone_zoneid
                            FROM aoac_userzone_map_config login_zone
                            WHERE login_zone.num_userzone_userid = :loginUser
                              AND login_zone.num_userzone_ulbid = :UlbId
                        )
                  )
              )

              OR
              (
                  NOT EXISTS
                  (
                      SELECT 1
                      FROM aoac_userdept_map_config login_dept
                      WHERE login_dept.num_userdept_userid = :loginUser
                        AND login_dept.num_userdept_ulbid = :UlbId
                  )

                  AND

                  NOT EXISTS
                  (
                      SELECT 1
                      FROM aoac_userzone_map_config login_zone
                      WHERE login_zone.num_userzone_userid = :loginUser
                        AND login_zone.num_userzone_ulbid = :UlbId
                  )
              )
          )
      `;

      if (params.zoneId && params.zoneId !== "-1") {
        query += ` AND num_payment_zoneid = :ZoneId`;
        bindParams.ZoneId = params.zoneId;
      }

      if (params.budgetId && params.budgetId !== "0") {
        query += ` AND num_budget_id = :BudgetId`;
        bindParams.BudgetId = params.budgetId;
      }

      if (params.userId && params.userId !== "0") {
        query += ` AND var_payment_insby = :UserId`;
        bindParams.UserId = params.userId;
      }

      if (params.nidhiId && params.nidhiId !== "0") {
        query += ` AND num_payment_nidhi_id = :NidhiId`;
        bindParams.NidhiId = params.nidhiId;
      }

      query += `
        GROUP BY 
          num_payment_refno,
          date_payment_trnsdate,
          num_payment_vchno,
          var_trnstype_trnstypemar,
          zoneename,
          var_grampanch_marathiname,
          var_payment_insby,
          date_payment_insdate,
          num_payment_trnstype,
          var_budgethead_name,
          var_partymst_partyname
        ORDER BY num_payment_refno
      `;
    }

    // ================= TRANSFER =================
    else if (["5", "8", "9"].includes(params.transType)) {
      query = `
        SELECT 
          num_transfermst_refno refno,
          date_transfermst_trnsdate trnsdate,
          num_transfermst_vchno docno,
          var_trnstype_trnstypemar trnstype,
          zoneename zonename,
          var_grampanch_marathiname grampanch,
          SUM(num_transferdet_amt) amount,
          num_transfermst_insby username,
          date_transfermst_insdate datetime,
          num_trnstype_trnstypeid trnstypeid,
          var_partymst_partyname PartyName
        FROM aoac_transfermst_def
        INNER JOIN aoac_transferdet_def 
          ON num_transferdet_refno = num_transfermst_refno
        INNER JOIN aoac_trnstype_def 
          ON num_trnstype_trnstypeid = num_transfermst_trnstypeid
        LEFT JOIN view_zone 
          ON zoneid = num_transfermst_zoneid
        LEFT JOIN aoac_partymst_def 
          ON num_partymst_partyid = num_transferdet_partyid
        LEFT JOIN aoac_grampanch_def 
          ON num_grampanch_deptid = num_transfermst_zoneid 
          AND num_grampanch_grampanchid = num_transfermst_grampanchid
        WHERE 
          date_transfermst_trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
            AND date_transfermst_trnsdate < TO_DATE(:ToDate,'YYYY-MM-DD') + 1
          AND num_transferdet_amt > 0
          AND var_transfermst_authstatus IS NULL
          AND num_transfermst_trnstypeid = :TransType
          AND corpid = :UlbId
          AND
          (
              (
                  EXISTS
                  (
                      SELECT 1
                      FROM aoac_userdept_map_config login_dept
                      WHERE login_dept.num_userdept_userid = :loginUser
                        AND login_dept.num_userdept_ulbid = :UlbId
                  )

                  AND

                  EXISTS
                  (
                      SELECT 1
                      FROM aoac_userzone_map_config login_zone
                      WHERE login_zone.num_userzone_userid = :loginUser
                        AND login_zone.num_userzone_ulbid = :UlbId
                  )

                  AND

                  EXISTS
                  (
                      SELECT 1
                      FROM aoac_userzone_map_config login_zone
                      WHERE login_zone.num_userzone_userid = :loginUser
                        AND login_zone.num_userzone_ulbid = :UlbId
                        AND login_zone.num_userzone_zoneid =
                            rmst.num_receiptmst_zoneid
                  )

                  AND

                  EXISTS
                  (
                      SELECT 1
                      FROM aoms_accusermap_mas aum
                      WHERE aum.num_accusermap_userid =
                            rmst.var_receiptmst_insby

                        AND aum.num_accusermap_deptid IN
                        (
                            SELECT login_dept.num_userdept_deptid
                            FROM aoac_userdept_map_config login_dept
                            WHERE login_dept.num_userdept_userid = :loginUser
                              AND login_dept.num_userdept_ulbid = :UlbId
                        )

                        AND aum.num_accusermap_ward IN
                        (
                            SELECT login_zone.num_userzone_zoneid
                            FROM aoac_userzone_map_config login_zone
                            WHERE login_zone.num_userzone_userid = :loginUser
                              AND login_zone.num_userzone_ulbid = :UlbId
                        )
                  )
              )

              OR
              (
                  NOT EXISTS
                  (
                      SELECT 1
                      FROM aoac_userdept_map_config login_dept
                      WHERE login_dept.num_userdept_userid = :loginUser
                        AND login_dept.num_userdept_ulbid = :UlbId
                  )

                  AND

                  NOT EXISTS
                  (
                      SELECT 1
                      FROM aoac_userzone_map_config login_zone
                      WHERE login_zone.num_userzone_userid = :loginUser
                        AND login_zone.num_userzone_ulbid = :UlbId
                  )
              )
          )
      `;

      bindParams.TransType = params.transType;

      if (params.zoneId && params.zoneId !== "-1") {
        query += ` AND num_transfermst_zoneid = :ZoneId`;
        bindParams.ZoneId = params.zoneId;
      }

      if (params.budgetId && params.budgetId !== "0") {
        query += ` AND num_transfermst_budget_id = :BudgetId`;
        bindParams.BudgetId = params.budgetId;
      }

      if (params.userId && params.userId !== "0") {
        query += ` AND num_transfermst_insby = :UserId`;
        bindParams.UserId = params.userId;
      }

      if (params.nidhiId && params.nidhiId !== "0") {
        query += ` AND num_transfermst_nidhi_id = :NidhiId`;
        bindParams.NidhiId = params.nidhiId;
      }

      query += `
        GROUP BY 
          num_transfermst_refno,
          date_transfermst_trnsdate,
          num_transfermst_vchno,
          var_trnstype_trnstypemar,
          zoneename,
          var_grampanch_marathiname,
          num_transfermst_insby,
          date_transfermst_insdate,
          num_trnstype_trnstypeid,
          var_partymst_partyname
        ORDER BY num_transfermst_refno
      `;
    } else {
      throw new Error("Invalid Transaction Type");
    }

    console.log(query);

    return await executeQuery(query, bindParams);
  } catch (err) {
    throw err;
  }
};

// const getTransactionList = async (params) => {
//   try {
//     let query = "";
//     let bindParams = {
//       FromDate: params.fromDate,
//       ToDate: params.toDate,
//       UlbId: params.ulbId,
//     };


//     // ================= RECEIPT =================
// //     if (params.transType === "1") {
// //       query = `
// //         SELECT
// //     rmst.num_receiptmst_refno AS refno,
// //     rmst.date_receiptmst_trnsdate AS trnsdate,
// //     tt.var_trnstype_trnstypemar AS trnstype,
// //     vz.zoneename AS zonename,
// //     gp.var_grampanch_marathiname AS grampanch,
// //    SUM(num_receiptdet_amount) - MAX(NVL(num_receiptdesc_amount,0)) amount,
// //     rmst.var_receiptmst_insby AS username,
// //     rmst.date_receiptmst_insdate AS datetime,
// //     rmst.num_receiptmst_trnstypeid AS trnstypeid,
// //     pmst.var_partymst_partyname AS PartyName,


// //     -- Extra GL details (will show values if match exists, otherwise NULL)
// //     a.glcode,
// //     acc.glname,
// //     a.accno,
// //     acc.accname,
// //     acc.functioncode,
// //     acc.objectcode,
// //     0 AS BudgetCode,
// //     MAX(NVL(rdesc.num_receiptdesc_amount, 0)) AS discountamount


// // FROM aoac_receiptmst_def rmst


// // INNER JOIN aoac_receiptdet_def det
// //     ON det.num_receiptdet_refno = rmst.num_receiptmst_refno


// // INNER JOIN aoac_trnstype_def tt
// //     ON tt.num_trnstype_trnstypeid = rmst.num_receiptmst_trnstypeid


// // LEFT JOIN view_zone vz
// //     ON vz.zoneid = rmst.num_receiptmst_zoneid


// // LEFT JOIN aoac_partymst_def pmst
// //     ON pmst.num_partymst_partyid = det.num_receiptdet_partycode


// // LEFT JOIN aoac_grampanch_def gp
// //     ON gp.num_grampanch_deptid = rmst.num_receiptmst_zoneid
// //    AND gp.num_grampanch_grampanchid = rmst.num_receiptmst_grampanchid


// // -- FIXED: Changed from INNER JOIN to LEFT JOIN so your core data is not dropped
// // LEFT JOIN transview a
// //     ON rmst.num_receiptmst_trnsno = a.transno
// //    AND rmst.num_receiptmst_ulbid = a.ulbid


// // -- FIXED: Changed to LEFT JOIN to match the transview layer safely
// // LEFT JOIN accountview_web acc
// //     ON a.glcode = acc.glcode
// //    AND a.accno = acc.accno
// //    AND acc.ulbid = a.ulbid


// // LEFT JOIN aoac_receiptdesc_def rdesc
// //     ON rdesc.num_receiptdesc_refno = rmst.num_receiptmst_refno
// //         WHERE 
// //           rmst.date_receiptmst_trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
// //           AND rmst.date_receiptmst_trnsdate < TO_DATE(:ToDate,'YYYY-MM-DD') + 1
// //           AND rmst.var_receiptmst_authstatus IS NULL
// //           AND rmst.num_receiptmst_ulbid = :UlbId
// //       `;


// //       if (params.zoneId && params.zoneId !== "-1") {
// //         query += ` AND rmst.num_receiptmst_zoneid = :ZoneId`;
// //         bindParams.ZoneId = params.zoneId;
// //       }


// //       if (params.budgetId && params.budgetId !== "0") {
// //         query += ` AND rmst.num_receiptmst_budget_id = :BudgetId`;
// //         bindParams.BudgetId = params.budgetId;
// //       }


// //       if (params.userId && params.userId !== "0") {
// //         query += ` AND rmst.var_receiptmst_insby = :UserId`;
// //         bindParams.UserId = params.userId;
// //       }


// //       if (params.nidhiId && params.nidhiId !== "0") {
// //         query += ` AND rmst.num_receiptmst_nidhi_id = :NidhiId`;
// //         bindParams.NidhiId = params.nidhiId;
// //       }


// //       query += `
// //         GROUP BY
// //     rmst.num_receiptmst_refno,
// //     rmst.date_receiptmst_trnsdate,
// //     tt.var_trnstype_trnstypemar,
// //     vz.zoneename,
// //     gp.var_grampanch_marathiname,
// //     rmst.var_receiptmst_insby,
// //     rmst.date_receiptmst_insdate,
// //     rmst.num_receiptmst_trnstypeid,
// //     pmst.var_partymst_partyname,
// //     a.glcode,
// //     acc.glname,
// //     a.accno,
// //     acc.accname,
// //     acc.functioncode,
// //     acc.objectcode


// // ORDER BY
// //     rmst.date_receiptmst_trnsdate,
// //     rmst.num_receiptmst_refno
// //       `;
// //     }
//     if (params.transType === "1") {
//       query = `
//         SELECT
//             rmst.num_receiptmst_refno AS refno,
//             rmst.date_receiptmst_trnsdate AS trnsdate,
//             tt.var_trnstype_trnstypemar AS trnstype,
//             vz.zoneename AS zonename,
//             gp.var_grampanch_marathiname AS grampanch,

//             NVL(det.total_amount, 0) - NVL(rdesc.discount_amount, 0) AS amount,

//             rmst.var_receiptmst_insby AS username,
//             rmst.date_receiptmst_insdate AS datetime,
//             rmst.num_receiptmst_trnstypeid AS trnstypeid,
//             pmst.var_partymst_partyname AS PartyName,

//             a.glcode,
//             acc.glname,
//             a.accno,
//             acc.accname,
//             acc.functioncode,
//             acc.objectcode,

//             0 AS BudgetCode,

//             NVL(rdesc.discount_amount, 0) AS discountamount

//         FROM aoac_receiptmst_def rmst

//         LEFT JOIN (
//             SELECT
//                 num_receiptdet_refno,
//                 SUM(num_receiptdet_amount) AS total_amount,
//                 MAX(num_receiptdet_partycode) AS partycode
//             FROM aoac_receiptdet_def
//             GROUP BY num_receiptdet_refno
//         ) det
//             ON det.num_receiptdet_refno = rmst.num_receiptmst_refno

//         LEFT JOIN (
//             SELECT
//                 num_receiptdesc_refno,
//                 SUM(num_receiptdesc_amount) AS discount_amount
//             FROM aoac_receiptdesc_def
//             GROUP BY num_receiptdesc_refno
//         ) rdesc
//             ON rdesc.num_receiptdesc_refno = rmst.num_receiptmst_refno

//         INNER JOIN aoac_trnstype_def tt
//             ON tt.num_trnstype_trnstypeid = rmst.num_receiptmst_trnstypeid

//         LEFT JOIN view_zone vz
//             ON vz.zoneid = rmst.num_receiptmst_zoneid

//         LEFT JOIN aoac_partymst_def pmst
//             ON pmst.num_partymst_partyid = det.partycode

//         LEFT JOIN aoac_grampanch_def gp
//             ON gp.num_grampanch_deptid = rmst.num_receiptmst_zoneid
//           AND gp.num_grampanch_grampanchid = rmst.num_receiptmst_grampanchid

//         LEFT JOIN transview a
//             ON rmst.num_receiptmst_trnsno = a.transno
//           AND rmst.num_receiptmst_ulbid = a.ulbid

//         LEFT JOIN accountview_web acc
//             ON a.glcode = acc.glcode
//           AND a.accno = acc.accno
//           AND acc.ulbid = a.ulbid

//         WHERE 
//           rmst.date_receiptmst_trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
//           AND rmst.date_receiptmst_trnsdate < TO_DATE(:ToDate,'YYYY-MM-DD') + 1
//           AND rmst.var_receiptmst_authstatus IS NULL
//           AND rmst.num_receiptmst_ulbid = :UlbId

//       `;


//       if (params.zoneId && params.zoneId !== "-1") {
//         query += ` AND rmst.num_receiptmst_zoneid = :ZoneId`;
//         bindParams.ZoneId = params.zoneId;
//       }


//       if (params.budgetId && params.budgetId !== "0") {
//         query += ` AND rmst.num_receiptmst_budget_id = :BudgetId`;
//         bindParams.BudgetId = params.budgetId;
//       }


//       if (params.userId && params.userId !== "0") {
//         query += ` AND rmst.var_receiptmst_insby = :UserId`;
//         bindParams.UserId = params.userId;
//       }


//       if (params.nidhiId && params.nidhiId !== "0") {
//         query += ` AND rmst.num_receiptmst_nidhi_id = :NidhiId`;
//         bindParams.NidhiId = params.nidhiId;
//       }


//       query += `
// ORDER BY
//     rmst.date_receiptmst_trnsdate,
//     rmst.num_receiptmst_refno
//       `;
//     }


//     // ================= PAYMENT =================
//     else if (params.transType === "2") {
//       query = `
//         SELECT 
//           num_payment_refno refno,
//           date_payment_trnsdate trnsdate,
//           num_payment_vchno docno,
//           var_trnstype_trnstypemar trnstype,
//           zoneename zonename,
//           var_grampanch_marathiname grampanch,
//           SUM(num_paymentdet_amount) amount,
//           var_payment_insby username,
//           date_payment_insdate datetime,
//           num_payment_trnstype trnstypeid,
//           var_partymst_partyname PartyName,
//           var_budgethead_name budgetname
//         FROM aoac_payment_def
//         LEFT JOIN aoac_budgethead_mst 
//           ON num_budget_id = num_budgethead_id
//         INNER JOIN aoac_paymentdet_def 
//           ON num_payment_refno = num_paymentdet_refno
//         INNER JOIN aoac_trnstype_def 
//           ON num_trnstype_trnstypeid = num_payment_trnstype
//         INNER JOIN view_zone 
//           ON zoneid = num_payment_zoneid
//         LEFT JOIN aoac_partymst_def 
//           ON num_partymst_partyid = num_paymentdet_partycode
//         LEFT JOIN aoac_grampanch_def 
//           ON num_grampanch_deptid = num_payment_zoneid 
//           AND num_grampanch_grampanchid = num_payment_grampanchid
//         WHERE 
//             date_payment_trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
//             AND date_payment_trnsdate < TO_DATE(:ToDate,'YYYY-MM-DD') + 1
//           AND var_payment_authstatus IS NULL
//           AND corpid = :UlbId
//       `;


//       if (params.zoneId && params.zoneId !== "-1") {
//         query += ` AND num_payment_zoneid = :ZoneId`;
//         bindParams.ZoneId = params.zoneId;
//       }


//       if (params.budgetId && params.budgetId !== "0") {
//         query += ` AND num_budget_id = :BudgetId`;
//         bindParams.BudgetId = params.budgetId;
//       }


//       if (params.userId && params.userId !== "0") {
//         query += ` AND var_payment_insby = :UserId`;
//         bindParams.UserId = params.userId;
//       }


//       if (params.nidhiId && params.nidhiId !== "0") {
//         query += ` AND num_payment_nidhi_id = :NidhiId`;
//         bindParams.NidhiId = params.nidhiId;
//       }


//       query += `
//         GROUP BY 
//           num_payment_refno,
//           date_payment_trnsdate,
//           num_payment_vchno,
//           var_trnstype_trnstypemar,
//           zoneename,
//           var_grampanch_marathiname,
//           var_payment_insby,
//           date_payment_insdate,
//           num_payment_trnstype,
//           var_budgethead_name,
//           var_partymst_partyname
//         ORDER BY num_payment_refno
//       `;
//     }


//     // ================= TRANSFER =================
//     else if (["5", "8", "9"].includes(params.transType)) {
//       query = `
//         SELECT 
//           num_transfermst_refno refno,
//           date_transfermst_trnsdate trnsdate,
//           num_transfermst_vchno docno,
//           var_trnstype_trnstypemar trnstype,
//           zoneename zonename,
//           var_grampanch_marathiname grampanch,
//           SUM(num_transferdet_amt) amount,
//           num_transfermst_insby username,
//           date_transfermst_insdate datetime,
//           num_trnstype_trnstypeid trnstypeid,
//           var_partymst_partyname PartyName
//         FROM aoac_transfermst_def
//         INNER JOIN aoac_transferdet_def 
//           ON num_transferdet_refno = num_transfermst_refno
//         INNER JOIN aoac_trnstype_def 
//           ON num_trnstype_trnstypeid = num_transfermst_trnstypeid
//         LEFT JOIN view_zone 
//           ON zoneid = num_transfermst_zoneid
//         LEFT JOIN aoac_partymst_def 
//           ON num_partymst_partyid = num_transferdet_partyid
//         LEFT JOIN aoac_grampanch_def 
//           ON num_grampanch_deptid = num_transfermst_zoneid 
//           AND num_grampanch_grampanchid = num_transfermst_grampanchid
//         WHERE 
//           date_transfermst_trnsdate >= TO_DATE(:FromDate,'YYYY-MM-DD')
//             AND date_transfermst_trnsdate < TO_DATE(:ToDate,'YYYY-MM-DD') + 1
//           AND num_transferdet_amt > 0
//           AND var_transfermst_authstatus IS NULL
//           AND num_transfermst_trnstypeid = :TransType
//           AND corpid = :UlbId
//       `;


//       bindParams.TransType = params.transType;


//       if (params.zoneId && params.zoneId !== "-1") {
//         query += ` AND num_transfermst_zoneid = :ZoneId`;
//         bindParams.ZoneId = params.zoneId;
//       }


//       if (params.budgetId && params.budgetId !== "0") {
//         query += ` AND num_transfermst_budget_id = :BudgetId`;
//         bindParams.BudgetId = params.budgetId;
//       }


//       if (params.userId && params.userId !== "0") {
//         query += ` AND num_transfermst_insby = :UserId`;
//         bindParams.UserId = params.userId;
//       }


//       if (params.nidhiId && params.nidhiId !== "0") {
//         query += ` AND num_transfermst_nidhi_id = :NidhiId`;
//         bindParams.NidhiId = params.nidhiId;
//       }


//       query += `
//         GROUP BY 
//           num_transfermst_refno,
//           date_transfermst_trnsdate,
//           num_transfermst_vchno,
//           var_trnstype_trnstypemar,
//           zoneename,
//           var_grampanch_marathiname,
//           num_transfermst_insby,
//           date_transfermst_insdate,
//           num_trnstype_trnstypeid,
//           var_partymst_partyname
//         ORDER BY num_transfermst_refno
//       `;
//     } else {
//       throw new Error("Invalid Transaction Type");
//     }
//     return await executeQuery(query, bindParams);
//   } catch (err) {
//     throw err;
//   }
// };

// const getUserList = async (ulbId, deptId) => {
//   try {
//     const query = `
//       SELECT  
//         var_user_username AS UserName,
//         num_user_userid AS UserId
//       FROM admins.aoma_user_def
//       WHERE num_user_deptid = :DeptId
//         AND num_user_ulbid = :UlbId
//     `;

//     const bindParams = {
//       DeptId: deptId,
//       UlbId: ulbId,
//     };

//     return await executeQuery(query, bindParams);
//   } catch (err) {
//     throw err;
//   }
// };

// const getUserList = async (ulbId, deptId, loginUserId) => {
//   try {
//     const query = `
//       WITH login_departments AS
//       (
//           SELECT DISTINCT
//               NUM_USERDEPT_DEPTID AS DeptId
//           FROM aoac_userdept_map_config
//           WHERE NUM_USERDEPT_USERID = :LoginUserId
//             AND NUM_USERDEPT_ULBID = :UlbId
//       ),

//       mapped_users AS
//       (
//           SELECT DISTINCT
//               NUM_USERDEPT_USERID AS UserId
//           FROM aoac_userdept_map_config
//           WHERE NUM_USERDEPT_ULBID = :UlbId
//             AND NUM_USERDEPT_DEPTID IN
//             (
//                 SELECT DeptId
//                 FROM login_departments
//             )
//       )

//       SELECT DISTINCT
//           u.var_user_username AS UserName,
//           u.num_user_userid AS UserId
//       FROM admins.aoma_user_def u
//       WHERE
//           (
//               EXISTS
//               (
//                   SELECT 1
//                   FROM login_departments
//               )
//               AND u.num_user_userid IN
//               (
//                   SELECT UserId
//                   FROM mapped_users
//               )
//               AND u.num_user_ulbid = :UlbId
//           )

//           OR

//           (
//               NOT EXISTS
//               (
//                   SELECT 1
//                   FROM login_departments
//               )
//               AND u.num_user_deptid = :DeptId
//               AND u.num_user_ulbid = :UlbId
//           )

//       ORDER BY u.var_user_username
//     `;

//     const bindParams = {
//       UlbId: ulbId,
//       DeptId: deptId,
//       LoginUserId: loginUserId,
//     };

//     return await executeQuery(query, bindParams);
//   } catch (err) {
//     throw err;
//   }
// };

const getUserList = async (ulbId, deptId, loginUserId) => {
  try {
    const query = `
      WITH login_departments AS
      (
          SELECT DISTINCT
              num_userdept_deptid AS DeptId
          FROM aoac_userdept_map_config
          WHERE num_userdept_userid = :LoginUserId
            AND num_userdept_ulbid = :UlbId
      ),

      login_zones AS
      (
          SELECT DISTINCT
              num_userzone_zoneid AS ZoneId
          FROM aoac_userzone_map_config
          WHERE num_userzone_userid = :LoginUserId
            AND num_userzone_ulbid = :UlbId
      ),

      mapped_users AS
      (
          SELECT DISTINCT
              a.num_accusermap_userid AS UserId
          FROM aoms_accusermap_mas a
          WHERE a.num_accusermap_deptid IN
          (
              SELECT DeptId
              FROM login_departments
          )
          AND a.num_accusermap_ward IN
          (
              SELECT ZoneId
              FROM login_zones
          )
      )

      SELECT DISTINCT
          u.var_user_username AS UserName,
          u.num_user_userid AS UserId
      FROM admins.aoma_user_def u
      WHERE
      (
          /* ======================================================
             LOGIN USER HAS DEPARTMENT AND ZONE MAPPING
             ====================================================== */

          EXISTS
          (
              SELECT 1
              FROM login_departments
          )

          AND EXISTS
          (
              SELECT 1
              FROM login_zones
          )

          AND u.num_user_userid IN
          (
              SELECT UserId
              FROM mapped_users
          )

          AND u.num_user_ulbid = :UlbId
      )

      OR

      (
          /* ======================================================
             LOGIN USER HAS NO DEPARTMENT / ZONE MAPPING

             Keep the previous fallback logic.
             ====================================================== */

          NOT EXISTS
          (
              SELECT 1
              FROM login_departments
          )

          AND NOT EXISTS
          (
              SELECT 1
              FROM login_zones
          )

          AND u.num_user_deptid = :DeptId
          AND u.num_user_ulbid = :UlbId
      )

      ORDER BY u.var_user_username
    `;

    const bindParams = {
      UlbId: ulbId,
      DeptId: deptId,
      LoginUserId: loginUserId,
    };

    return await executeQuery(query, bindParams);
  } catch (err) {
    throw err;
  }
};

const getTransactionDetails = async (refNo, trnsTypeId) => {
  let query = "";
  let bindParams = { refNo };

  // ================= RECEIPT =================
//   if ([1, 2].includes(trnsTypeId)) {
//     query = `
//       SELECT
//     num_receiptmst_refno refno,
//     date_receiptmst_trnsdate trnsdate,
//     num_receiptmst_recno docno,
//     var_trnstype_trnstypemar trnstype,
//     zoneename zonename,
//     var_grampanch_marathiname grampanch,

//     num_receiptmst_drgl crdrgl,
//     dracc.glname crdrglname,

//     num_receiptmst_dracc crdracc,
//     dracc.accname crdraccname,

//     num_receiptdet_glcode glcode,
//     acc.glname,

//     num_receiptdet_accno accno,
//     acc.accname,

//     num_receiptdet_amount amount,

//     var_receiptdet_narration narration,
//     var_partymst_partyname party,

//     acc.functioncode,
//     acc.objectcode,

//     dracc.functioncode draccfunctioncode,
//     dracc.objectcode draccobjectcode,

//     /* Added fields */
//     0 AS BudgetCode,
//     NVL(rdesc.discountamount,0) AS discountamount

// FROM aoac_receiptmst_def

// INNER JOIN aoac_receiptdet_def
//     ON num_receiptdet_refno = num_receiptmst_refno

// INNER JOIN aoac_trnstype_def
//     ON num_trnstype_trnstypeid = num_receiptmst_trnstypeid

// LEFT JOIN view_zone
//     ON zoneid = num_receiptmst_zoneid

// LEFT JOIN accountview_web dracc
//     ON dracc.glcode = num_receiptmst_drgl
//    AND dracc.accno = num_receiptmst_dracc
//    AND dracc.ulbid = num_receiptmst_ulbid

// LEFT JOIN accountview_web acc
//     ON acc.glcode = num_receiptdet_glcode
//    AND acc.accno = num_receiptdet_accno
//    AND acc.ulbid = num_receiptmst_ulbid

// LEFT JOIN aoac_grampanch_def
//     ON num_grampanch_deptid = num_receiptmst_zoneid
//    AND num_grampanch_grampanchid = num_receiptmst_grampanchid

// LEFT JOIN aoac_partymst_def
//     ON num_partymst_partyid = num_receiptdet_partycode

// /* Added join */
// LEFT JOIN (
//     SELECT
//         num_receiptdesc_refno,
//         MAX(NVL(num_receiptdesc_amount,0)) discountamount
//     FROM aoac_receiptdesc_def
//     GROUP BY num_receiptdesc_refno
// ) rdesc
//     ON rdesc.num_receiptdesc_refno = num_receiptmst_refno
//       WHERE num_receiptmst_refno = :refNo
//     `;
//   }
  if ([1, 2].includes(trnsTypeId)) {
    query = `
SELECT
    num_receiptmst_refno refno,
    date_receiptmst_trnsdate trnsdate,
    num_receiptmst_recno docno,
    var_trnstype_trnstypemar trnstype,
    zoneename zonename,
    var_grampanch_marathiname grampanch,

    num_receiptmst_drgl crdrgl,
    dracc.glname crdrglname,

    num_receiptmst_dracc crdracc,
    dracc.accname crdraccname,

    num_receiptdet_glcode glcode,
    acc.glname,

    num_receiptdet_accno accno,
    acc.accname,

    num_receiptdet_amount amount,

    var_receiptdet_narration narration,
    var_partymst_partyname party,

    acc.functioncode,
    acc.objectcode,

    dracc.functioncode draccfunctioncode,
    dracc.objectcode draccobjectcode,

    /* Added fields */
    0 AS BudgetCode,
    NVL(rdesc.discount_amount, 0) AS discountamount,
    d.num_accmpdet_id

FROM aoac_receiptmst_def rmst

INNER JOIN aoac_receiptdet_def
    ON num_receiptdet_refno = num_receiptmst_refno

INNER JOIN aoac_trnstype_def
    ON num_trnstype_trnstypeid = num_receiptmst_trnstypeid
    
 INNER JOIN
    (
        SELECT
            var_accmpdet_accno,
            MIN(num_accmpdet_id) AS num_accmpdet_id
        FROM aoms_accusermap_det
        GROUP BY var_accmpdet_accno
    ) d
        ON d.var_accmpdet_accno = num_receiptdet_accno

LEFT JOIN view_zone
    ON zoneid = num_receiptmst_zoneid

LEFT JOIN accountview_web dracc
    ON dracc.glcode = num_receiptmst_drgl
   AND dracc.accno = num_receiptmst_dracc
   AND dracc.ulbid = num_receiptmst_ulbid

LEFT JOIN accountview_web acc
    ON acc.glcode = num_receiptdet_glcode
   AND acc.accno = num_receiptdet_accno
   AND acc.ulbid = num_receiptmst_ulbid

LEFT JOIN aoac_grampanch_def
    ON num_grampanch_deptid = num_receiptmst_zoneid
   AND num_grampanch_grampanchid = num_receiptmst_grampanchid

LEFT JOIN aoac_partymst_def
    ON num_partymst_partyid = num_receiptdet_partycode

/* Added join */
LEFT JOIN (
    SELECT
        num_receiptdesc_refno,
        SUM(num_receiptdesc_amount) AS discount_amount
    FROM aoac_receiptdesc_def
    GROUP BY num_receiptdesc_refno
) rdesc
    ON rdesc.num_receiptdesc_refno = rmst.num_receiptmst_refno

      WHERE num_receiptmst_refno = :refNo
       ORDER BY d.num_accmpdet_id
    `;
  }
  // ================= PAYMENT =================
  else if ([3, 4].includes(trnsTypeId)) {
    query = `
      SELECT 
        num_payment_refno refno,
        date_payment_trnsdate trnsdate,
        num_payment_vchno docno,
        var_trnstype_trnstypemar trnstype,
        zoneename zonename,
        var_grampanch_marathiname grampanch,
        num_payment_crgl crdrgl,
        dracc.glname crdrglname,
        num_payment_cracc crdracc,
        dracc.accname crdraccname,
        num_paymentdet_glcode glcode,
        acc.glname,
        num_paymentdet_accno accno,
        acc.accname,
        num_paymentdet_amount amount,
        var_paymentdet_narration narration,
        var_partymst_partyname party,
        acc.functioncode,
        acc.objectcode,
        dracc.functioncode draccfunctioncode,
        dracc.objectcode draccobjectcode
      FROM aoac_payment_def
      INNER JOIN aoac_paymentdet_def 
        ON num_payment_refno = num_paymentdet_refno
      INNER JOIN aoac_trnstype_def 
        ON num_trnstype_trnstypeid = num_payment_trnstype
      INNER JOIN view_zone 
        ON zoneid = num_payment_zoneid
      LEFT  JOIN accountview_web dracc 
        ON dracc.glcode = num_payment_crgl 
        AND dracc.accno = num_payment_cracc 
        AND dracc.ulbid = num_payment_ulbid
      LEFT  JOIN accountview_web acc 
        ON acc.glcode = num_paymentdet_glcode 
        AND acc.accno = num_paymentdet_accno 
        AND acc.ulbid = num_payment_ulbid
      LEFT JOIN aoac_grampanch_def 
        ON num_grampanch_deptid = num_payment_zoneid 
        AND num_grampanch_grampanchid = num_payment_grampanchid
      LEFT JOIN aoac_partymst_def 
        ON num_partymst_partyid = num_paymentdet_partycode
      WHERE num_payment_refno = :refNo
    `;
  }

  // ================= TRANSFER =================
  else if ([5, 8, 9].includes(trnsTypeId)) {
    query = `
      SELECT 
        num_transfermst_refno refno,
        date_transfermst_trnsdate trnsdate,
        num_transfermst_vchno docno,
        var_trnstype_trnstypemar trnstype,
        zoneename zonename,
        var_grampanch_marathiname grampanch,
        num_transferdet_glcode glcode,
        acc.glname,
        num_transferdet_accno accno,
        acc.accname,
        num_transferdet_amt amount,
        var_transferdet_narratn narration,
        var_partymst_partyname party,
        acc.functioncode,
        acc.objectcode
      FROM aoac_transfermst_def
      INNER JOIN aoac_transferdet_def 
        ON num_transferdet_refno = num_transfermst_refno
      INNER JOIN aoac_trnstype_def 
        ON num_trnstype_trnstypeid = num_transfermst_trnstypeid
      INNER JOIN view_zone 
        ON zoneid = num_transfermst_zoneid
      LEFT  JOIN accountview_web acc 
        ON acc.glcode = num_transferdet_glcode 
        AND acc.accno = num_transferdet_accno 
        AND num_transfermst_ulbid = acc.ulbid
      LEFT JOIN aoac_grampanch_def 
        ON num_grampanch_deptid = num_transfermst_zoneid 
        AND num_grampanch_grampanchid = num_transfermst_grampanchid
      LEFT JOIN aoac_partymst_def 
        ON num_partymst_partyid = num_transferdet_partyid
      WHERE num_transfermst_refno = :refNo
    `;
  }

  console.log(query);

  return await executeQuery(query, bindParams);
};

const insertTransAuth = (refNo, trnsSourceId, trnsStatus, str1, str2, userId) =>
  withTx(async (connection) => {
    console.log("Repo received data:", {
      refNo,
      trnsSourceId,
      trnsStatus,
      str1,
      str2,
      userId,
    });

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
        In_RefNo: Number(refNo),
        In_TrnsSourceId: Number(trnsSourceId),
        In_TrnsStatus: trnsStatus,
        In_Str1: str1 || null,
        In_Str2: str2 || null,
        In_UserId: userId || null,

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

    console.log("Repo Result :", result);

    return {
      errorCode: result.outBinds.out_ErrorCode,
      message: result.outBinds.out_ErrorMsg,
    };
  });

const getUserZones = async (ulbId, userId) => {
  try {
    const query = `
      SELECT
          vz.zoneename AS ZoneName,
          vz.zoneid AS ZoneId
      FROM view_zone vz
      WHERE vz.corpid = :UlbId
        AND (
              NOT EXISTS (
                  SELECT 1
                  FROM aoac_userzone_map_config uz
                  WHERE uz.num_userzone_userid = :UserId
                    AND uz.num_userzone_ulbid = :UlbId
              )
              OR EXISTS (
                  SELECT 1
                  FROM aoac_userzone_map_config uz
                  WHERE uz.num_userzone_userid = :UserId
                    AND uz.num_userzone_ulbid = :UlbId
                    AND uz.num_userzone_zoneid = vz.zoneid
              )
            )
      ORDER BY vz.zoneid
    `;

    const bindParams = {
      UlbId: ulbId,
      UserId: userId,
    };

    return await executeQuery(query, bindParams);
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getTransactionList,
  getUserList,
  getTransactionDetails,
  insertTransAuth,
  getUserZones
};
