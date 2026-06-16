const { executeQuery } = require("../../../db/queryExecutor");

async function getGrampanchayatListRepo(deptId) {
  console.log("📤 Repo: Fetch Grampanchayat List", deptId);

  const sql = `
    SELECT 
      var_grampanch_marathiname AS grampanchname,
      num_grampanch_grampanchid AS grampanchid,
      num_grampanch_deptid AS deptid
    FROM aoac_grampanch_def
    WHERE num_grampanch_deptid = :deptId
  `;

  const result = await executeQuery(sql, { deptId });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}

async function getCashBankBalanceReportRepo(payload) {
  console.log("📤 Repo: Fetch Cash Bank Balance Report", payload);

  const { asOnDate, zoneId, ulbId } = payload;

  const sql = `
    SELECT 
        c.accsubtypeid AS balscode,
        '' AS subtype,
        c.glcode,
        c.glname,
        c.accno,
        c.accname,
        c.objectcode,
        c.functioncode,

        NVL(
            SUM(
                c.openingbal +
                (
                    SELECT NVL(SUM(a.amount), 0)
                    FROM transview a
                    WHERE a.glcode = c.glcode
                      AND a.accno = c.accno
                      AND a.zoneid = :zoneId
                      AND TRUNC(a.trnsdate) <= TO_DATE(:asOnDate, 'YYYY-MM-DD')
                      AND a.ulbid = :ulbId
                )
            ), 0
        ) AS balance

    FROM accountview_web c

    WHERE c.accsubtypeid IN (4820, 4821, 4822, 4823, 17, 4829)
      AND c.ulbid = :ulbId

    GROUP BY 
        c.accsubtypeid,
        c.glcode,
        c.glname,
        c.accno,
        c.accname,
        c.objectcode,
        c.functioncode

    UNION ALL

    SELECT 
        c.accsubtypeid AS balscode,
        ' ' AS subtype,
        c.glcode,
        c.glname,
        c.accno,
        c.accname,
        c.objectcode,
        c.functioncode,

        NVL(
            SUM(
                c.openingbal +
                (
                    SELECT NVL(SUM(a.amount), 0)
                    FROM transview a
                    WHERE a.glcode = c.glcode
                      AND a.accno = c.accno
                      AND a.zoneid = :zoneId
                      AND TRUNC(a.trnsdate) <= TO_DATE(:asOnDate, 'YYYY-MM-DD')
                      AND a.ulbid = :ulbId
                )
            ), 0
        ) AS balance

    FROM accountview_web c

    WHERE c.accsubtypeid IN (4810)
      AND c.ulbid = :ulbId

    GROUP BY 
        c.accsubtypeid,
        c.glcode,
        c.glname,
        c.accno,
        c.accname,
        c.objectcode,
        c.functioncode

    ORDER BY balscode, glcode, accno
  `;

  const binds = { asOnDate, zoneId, ulbId };

  const result = await executeQuery(sql, binds);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.rows;
}


async function getDailyTransactionDetailedReport(filters) {
  const { date, ulbId, corpCode, budgetId, nidhiId, zone } = filters;

  let params = {
    reportDate: date,
    ulbId: ulbId
  };

  let mbmcFilter1 = "";
  let mbmcFilter2 = "";
  let mbmcFilter3 = "";
  let mbmcFilter4 = "";

  if (corpCode === "MBMC") {
    if (budgetId && budgetId !== 0 && budgetId !== "0") {
      mbmcFilter1 += " AND a.budgetid = :budgetId ";
      mbmcFilter2 += " AND t.num_trans_budgetid = :budgetId ";
      mbmcFilter3 += " AND budgetid = :budgetId ";
      mbmcFilter4 += " AND budgetid = :budgetId ";
      params.budgetId = budgetId;
    }
    if (nidhiId && nidhiId !== 0 && nidhiId !== "0") {
      mbmcFilter1 += " AND a.nidhi_id = :nidhiId ";
      mbmcFilter2 += " AND t.num_trans_nidhiid = :nidhiId ";
      mbmcFilter3 += " AND a.nidhi_id = :nidhiId ";
      mbmcFilter4 += " AND a.nidhi_id = :nidhiId ";
      params.nidhiId = nidhiId;
    }
  }

  let zoneFilter1 = "";
  let zoneFilter2 = "";
  let zoneFilter3 = "";
  let zoneFilter4 = "";
  let zoneFilter5 = "";

  if (zone && zone !== "-1") {
    zoneFilter1 = " AND a.zoneid = :zone ";
    zoneFilter2 = " AND vpm.num_vchprepmst_zoneid = :zone ";
    zoneFilter3 = " AND a.zoneid = :zone ";
    zoneFilter4 = " AND a.zoneid = :zone ";
    zoneFilter5 = "  AND v.zoneid = :zone ";
    params.zone = zone;
  }

  const sql = `
    -- PART 1: Receipts (Type R)
    SELECT 
        a.transno, 
        a.trnsdate, 
        a.docno, 
        a.glcode, 
        a.accno, 
        a.narration, 
        CASE WHEN a.trnstypeid = 1 THEN a.amount ELSE 0 END AS cashamount, 
        CASE WHEN a.trnstypeid = 2 THEN a.amount ELSE 0 END AS bankamount, 
        'R' AS TransType, 
        TO_CHAR(a.chqno, 'FM000000') AS chqno, 
        CASE WHEN a.sourceid = 6 THEN a.amount ELSE 0 END AS transamount,
        v.zoneename AS zonename, 
        m.deptname AS grampanch,
        c.objectcode || ' ' || c.accname AS accname, 
        p.var_partymst_partyname AS PartyName, 
        NULL AS DelFlag,
        c.objectcode, 
        c.functioncode 
    FROM transview a 
    INNER JOIN accountview_web c 
        ON a.glcode = c.glcode 
        AND a.accno = c.accno 
        AND c.ulbid = a.ulbid 
    LEFT JOIN aoac_partymst_def p 
        ON p.num_partymst_partyid = a.partycode 
    LEFT JOIN view_zone v 
        ON v.zoneid = a.zoneid 
    LEFT OUTER JOIN vw_accdeptconfig m 
        ON m.deptid = a.accdept
    WHERE TRUNC(a.trnsdate) = TO_DATE(:reportDate, 'DD-MON-YYYY')
        AND a.amount > 0 
        AND a.trnstypeid IN (1, 2)
        AND c.ulbid = :ulbId
        ${mbmcFilter1}
        ${zoneFilter1}

    UNION ALL 

    -- PART 2: Voucher Payments (Type P)
    SELECT 
        num_vchtransbal_transno AS transno, 
        date_trans_trnsdate AS trnsdate, 
        (SELECT DISTINCT TO_CHAR(num_vchtransbal_vchtransbalno) 
         FROM aoac_vchtransbal_def 
         WHERE num_vchtransbal_transno = t.num_trans_transno) AS docno,    
        num_vchprepmst_drgl AS glcode, 
        num_vchprepmst_dracc AS accno, 
        var_vchpremst_narration AS narration, 
        0 AS cashamount,    
        num_vchtransbal_payamt AS bankamount, 
        'P' AS TransType, 
        TO_CHAR(num_trans_chqno, 'FM000000') AS chqno, 
        0 AS transamount,    
        NULL AS zonename, 
        NULL AS grampanch, 
        c.objectcode || ' ' || c.accname AS accname, 
        p.var_partymst_partyname AS PartyName, 
        NULL AS DelFlag, 
        c.objectcode, 
        c.functioncode
    FROM aoac_vchprepmst_def vpm
    INNER JOIN aoac_vchgenmst_def vgm 
        ON vgm.num_vchgenmst_refno = vpm.num_vchprepmst_refno 
    INNER JOIN accountview_web c 
        ON c.glcode = vpm.num_vchprepmst_drgl 
        AND c.accno = vpm.num_vchprepmst_dracc 
        AND c.ulbid = vpm.num_vchpremst_ulbid 
    LEFT JOIN aoac_partymst_def p 
        ON p.num_partymst_partyid = vpm.num_vchprepmst_partyid    
    INNER JOIN aoac_vchtransbal_def vtb 
        ON vtb.num_vchtransbal_vchrefno = vpm.num_vchprepmst_refno 
        AND vtb.num_vchtransbal_vchtransbalno = vgm.num_vchgenmst_trnsno 
    INNER JOIN aoac_trans_def t 
        ON t.num_trans_transno = vtb.num_vchtransbal_transno    
    WHERE TRUNC(t.date_trans_trnsdate) = TO_DATE(:reportDate, 'DD-MON-YYYY')
        AND c.ulbid = :ulbId
        ${zoneFilter2}
        ${mbmcFilter2}
    GROUP BY 
        num_vchtransbal_transno, 
        date_trans_trnsdate, 
        num_vchprepmst_vchno, 
        num_vchprepmst_drgl, 
        c.functioncode, 
        num_vchtransbal_payamt, 
        num_vchprepmst_dracc, 
        c.objectcode, 
        var_vchpremst_narration, 
        num_vchprepmst_totalamt, 
        TO_CHAR(num_trans_chqno, 'FM000000'), 
        c.objectcode || ' ' || c.accname, 
        var_partymst_partyname, 
        num_trans_transno

    UNION ALL 

    -- PART 3: General Payments (Type P)
    SELECT 
        a.transno, 
        a.trnsdate, 
        a.docno, 
        a.glcode, 
        a.accno, 
        p.var_partymst_partyname || ' ' || c.accname || ' ' || a.narration AS narration,    
        CASE WHEN a.trnstypeid = 3 THEN a.amount ELSE 0 END AS cashamount,    
        CASE WHEN a.trnstypeid = 4 THEN a.amount ELSE 0 END AS bankamount, 
        'P' AS TransType, 
        TO_CHAR(a.chqno, 'FM000000') AS chqno,     
        CASE WHEN a.trnstypeid = 8 THEN a.amount ELSE 0 END AS transamount, 
        v.zoneename AS zonename, 
        m.deptname AS grampanch,    
        c.objectcode || ' ' || c.accname AS accname, 
        p.var_partymst_partyname AS PartyName, 
        NULL AS DelFlag, 
        c.objectcode, 
        c.functioncode    
    FROM transview a    
    INNER JOIN accountview_web c 
        ON a.glcode = c.glcode 
        AND a.accno = c.accno 
        AND c.ulbid = a.ulbid    
    LEFT JOIN aoac_partymst_def p 
        ON p.num_partymst_partyid = a.partycode     
    LEFT JOIN view_zone v 
        ON v.zoneid = a.zoneid    
    LEFT OUTER JOIN vw_accdeptconfig m 
        ON m.deptid = a.accdept     
    WHERE TRUNC(a.trnsdate) = TO_DATE(:reportDate, 'DD-MON-YYYY') 
        AND a.amount < 0 
        AND a.trnstypeid IN (3, 4) 
        AND a.sourceid <> 6
        AND c.ulbid = :ulbId
        ${mbmcFilter3}
        ${zoneFilter3}

    UNION ALL 

    -- PART 4: Internal/Transfer Payments (Type P)
    SELECT 
        a.transno, 
        a.trnsdate, 
        a.docno, 
        a.glcode, 
        a.accno, 
        p.var_partymst_partyname || ' ' || c.accname || ' ' || a.narration AS narration,    
        0 AS cashamount,    
        0 AS bankamount, 
        'P' AS TransType, 
        TO_CHAR(a.chqno, 'FM000000') AS chqno,     
        CASE WHEN a.trnstypeid = 9 THEN a.amount ELSE 0 END AS transamount, 
        v.zoneename AS zonename, 
        m.deptname AS grampanch,    
        c.objectcode || ' ' || c.accname AS accname, 
        p.var_partymst_partyname AS PartyName, 
        NULL AS DelFlag, 
        c.objectcode, 
        c.functioncode
    FROM transview a    
    INNER JOIN accountview_web c 
        ON a.glcode = c.glcode 
        AND a.accno = c.accno 
        AND c.ulbid = a.ulbid 
    LEFT JOIN aoac_partymst_def p 
        ON p.num_partymst_partyid = a.partycode     
    LEFT JOIN view_zone v 
        ON v.zoneid = a.zoneid     
    LEFT OUTER JOIN vw_accdeptconfig m 
        ON m.deptid = a.accdept     
    WHERE TRUNC(a.trnsdate) = TO_DATE(:reportDate, 'DD-MON-YYYY') 
        AND a.amount > 0 
        AND a.trnstypeid IN (9) 
        AND a.sourceid <> 6    
        AND c.ulbid = :ulbId
        ${mbmcFilter4}
        ${zoneFilter4}

    UNION ALL

    SELECT
      num_receiptmst_trnsno AS transno,
      date_receiptmst_trnsdate AS trnsdate,
      TO_CHAR(num_receiptmst_refno) AS docno,
      num_receiptdesc_glcode AS glcode,
      num_receiptdesc_accno AS accno,
      var_receiptdesc_narration AS narration,
      CASE
          WHEN num_receiptmst_trnstypeid = 1
          THEN NVL(num_receiptdesc_amount,0)
          ELSE 0
      END AS cashamount,
      CASE
          WHEN num_receiptmst_trnstypeid = 2
          THEN NVL(num_receiptdesc_amount,0)
          ELSE 0
      END AS bankamount,
      'P' AS TransType,
      CAST(NULL AS VARCHAR2(20)) AS chqno,
      0 AS transamount,
      v.zoneename AS zonename,
      CAST(NULL AS VARCHAR2(200)) AS grampanch,
      c.objectcode || ' ' || c.accname AS accname,
      CAST(NULL AS VARCHAR2(200)) AS PartyName,
      CAST(NULL AS VARCHAR2(1)) AS DelFlag,
      c.objectcode,
      c.functioncode
      FROM aoac_receiptmst_def rm
      INNER JOIN aoac_receiptdesc_def rd  ON rm.num_receiptmst_refno = rd.num_receiptdesc_refno
      INNER JOIN accountview_web c  ON rd.num_receiptdesc_glcode = c.glcode AND rd.num_receiptdesc_accno = c.accno AND rm.num_receiptmst_ulbid = c.ulbid
      LEFT JOIN view_zone v
          ON v.zoneid = rm.num_receiptmst_zoneid

      WHERE TRUNC(rm.date_receiptmst_trnsdate) =
          TO_DATE(:reportDate, 'DD-MON-YYYY')
      AND c.ulbid = :ulbId
      AND rm.num_receiptmst_trnsno IS NOT NULL
      AND rd.num_receiptdesc_amount > 0
    ${zoneFilter5}


    ORDER BY TransType DESC, transno, docno, transamount
  `;

  console.log("Executing SQL with params:", params);
  console.log("Generated SQL:", sql);
  
  const result = await executeQuery(sql, params);

  if (!result.success) {
    console.error("SQL Error:", result.error);
    throw new Error(result.error);
  }
  if (result.rows && result.rows.length > 0) {
    console.log("First row column names:", Object.keys(result.rows[0]));
    console.log("First row sample:", result.rows[0]);
  }
  
  const transformedData = transformToCashBookFormat(result.rows);
  console.log("Transformed data count:", transformedData.length);
  
  return transformedData;
}

function transformToCashBookFormat(data) {
  if (!data || data.length === 0) return [];

  console.log("Transforming data, input length:", data.length);
  const receipts = [];
  const payments = [];

  data.forEach((item, index) => {
    const transType = item.TRANSTYPE || item.transtype;
    
    if (transType === 'R') {
      receipts.push({
        transno: item.TRANSNO || item.transno,
        trnsdate: item.TRNSDATE || item.trnsdate,
        docno: item.DOCNO || item.docno,
        glcode: item.GLCODE || item.glcode,
        accno: item.ACCNO || item.accno,
        narration: item.NARRATION || item.narration,
        cashamount: Math.abs(Number(item.CASHAMOUNT || item.cashamount || 0)),
        bankamount: Math.abs(Number(item.BANKAMOUNT || item.bankamount || 0)),
        chqno: item.CHQNO || item.chqno,
        transamount: Math.abs(Number(item.TRANSAMOUNT || item.transamount || 0)),
        zonename: item.ZONENAME || item.zonename,
        grampanch: item.GRAMPANCH || item.grampanch,
        accname: item.ACCNAME || item.accname,
        partyname: item.PARTYNAME || item.partyname,
        objectcode: item.OBJECTCODE || item.objectcode,
        functioncode: item.FUNCTIONCODE || item.functioncode
      });
    } else if (transType === 'P') {
      payments.push({
        transno: item.TRANSNO || item.transno,
        trnsdate: item.TRNSDATE || item.trnsdate,
        docno: item.DOCNO || item.docno,
        glcode: item.GLCODE || item.glcode,
        accno: item.ACCNO || item.accno,
        narration: item.NARRATION || item.narration,
        cashamount: Math.abs(Number(item.CASHAMOUNT || item.cashamount || 0)),
        bankamount: Math.abs(Number(item.BANKAMOUNT || item.bankamount || 0)),
        chqno: item.CHQNO || item.chqno,
        transamount: Math.abs(Number(item.TRANSAMOUNT || item.transamount || 0)),
        zonename: item.ZONENAME || item.zonename,
        grampanch: item.GRAMPANCH || item.grampanch,
        accname: item.ACCNAME || item.accname,
        partyname: item.PARTYNAME || item.partyname,
        objectcode: item.OBJECTCODE || item.objectcode,
        functioncode: item.FUNCTIONCODE || item.functioncode
      });
    }
  });
  const allTransactions = [];
  receipts.forEach(receipt => {
    allTransactions.push({
      type: 'R',
      data: receipt,
      date: new Date(receipt.trnsdate),
      transno: receipt.transno
    });
  });
  
  payments.forEach(payment => {
    allTransactions.push({
      type: 'P',
      data: payment,
      date: new Date(payment.trnsdate),
      transno: payment.transno
    });
  });
  
  allTransactions.sort((a, b) => {
    if (a.transno && b.transno) {
      return a.transno - b.transno;
    }
    return a.date - b.date;
  });
  
  const mergedData = [];
  let receiptIndex = 1;
  let paymentIndex = 1;
  
  const tempMap = new Map();
  
  allTransactions.forEach(transaction => {
    if (transaction.type === 'R') {
      const receipt = transaction.data;
      const existingRow = tempMap.get(receipt.transno);
      
      if (existingRow) {
        existingRow.RSrNo = receiptIndex++;
        existingRow.RTransNo = receipt.transno;
        existingRow.RTrnsDate = receipt.trnsdate;
        existingRow.RDocNo = receipt.docno;
        existingRow.RGLCode = receipt.glcode;
        existingRow.RAccNo = receipt.accno;
        existingRow.RAccNoWith0 = receipt.objectcode || '';
        existingRow.RNarration = receipt.narration;
        existingRow.RCashAmount = receipt.cashamount;
        existingRow.RBankAmount = receipt.bankamount;
        existingRow.RChqNo = receipt.chqno;
        existingRow.RTransferAmount = receipt.transamount;
        existingRow.RZone = receipt.zonename || '';
        existingRow.RDepartment = receipt.grampanch || '';
        existingRow.RAccname = receipt.accname || '';
      } else {
        mergedData.push({
          RSrNo: receiptIndex++,
          RTransNo: receipt.transno,
          RTrnsDate: receipt.trnsdate,
          RDocNo: receipt.docno,
          RGLCode: receipt.glcode,
          RAccNo: receipt.accno,
          RAccNoWith0: receipt.objectcode || '',
          RNarration: receipt.narration,
          RCashAmount: receipt.cashamount,
          RBankAmount: receipt.bankamount,
          RChqNo: receipt.chqno,
          RTransferAmount: receipt.transamount,
          RZone: receipt.zonename || '',
          RDepartment: receipt.grampanch || '',
          RAccname: receipt.accname || '',
          ReceiptTotal: 0,
          PSrNo: null,
          PTransNo: null,
          PTrnsDate: null,
          PDocNo: null,
          PGLCode: null,
          PAccNo: null,
          PAccNowith0: '',
          PNarration: '',
          PCashAmount: 0,
          PBankAmount: 0,
          PChqNo: null,
          PTransferAmount: 0,
          PAccname: '',
          PartyName: '',
          PaymentTotal: 0
        });
      }
    } else if (transaction.type === 'P') {
      const payment = transaction.data;
      const existingRow = tempMap.get(payment.transno);
      
      if (existingRow) {
        existingRow.PSrNo = paymentIndex++;
        existingRow.PTransNo = payment.transno;
        existingRow.PTrnsDate = payment.trnsdate;
        existingRow.PDocNo = payment.docno;
        existingRow.PGLCode = payment.glcode;
        existingRow.PAccNo = payment.accno;
        existingRow.PAccNowith0 = payment.objectcode || '';
        existingRow.PNarration = payment.narration;
        existingRow.PCashAmount = payment.cashamount;
        existingRow.PBankAmount = payment.bankamount;
        existingRow.PChqNo = payment.chqno;
        existingRow.PTransferAmount = payment.transamount;
        existingRow.PAccname = payment.accname || '';
        existingRow.PartyName = payment.partyname || '';
      } else {
        let found = false;
        for (let i = 0; i < mergedData.length; i++) {
          if (mergedData[i].RDocNo === payment.docno && mergedData[i].RDocNo) {
            mergedData[i].PSrNo = paymentIndex++;
            mergedData[i].PTransNo = payment.transno;
            mergedData[i].PTrnsDate = payment.trnsdate;
            mergedData[i].PDocNo = payment.docno;
            mergedData[i].PGLCode = payment.glcode;
            mergedData[i].PAccNo = payment.accno;
            mergedData[i].PAccNowith0 = payment.objectcode || '';
            mergedData[i].PNarration = payment.narration;
            mergedData[i].PCashAmount = payment.cashamount;
            mergedData[i].PBankAmount = payment.bankamount;
            mergedData[i].PChqNo = payment.chqno;
            mergedData[i].PTransferAmount = payment.transamount;
            mergedData[i].PAccname = payment.accname || '';
            mergedData[i].PartyName = payment.partyname || '';
            found = true;
            break;
          }
        }
        
        if (!found) {
          mergedData.push({
            RSrNo: null,
            RTransNo: null,
            RTrnsDate: null,
            RDocNo: null,
            RGLCode: null,
            RAccNo: null,
            RAccNoWith0: '',
            RNarration: '',
            RCashAmount: 0,
            RBankAmount: 0,
            RChqNo: null,
            RTransferAmount: 0,
            RZone: '',
            RDepartment: '',
            RAccname: '',
            ReceiptTotal: 0,
            PSrNo: paymentIndex++,
            PTransNo: payment.transno,
            PTrnsDate: payment.trnsdate,
            PDocNo: payment.docno,
            PGLCode: payment.glcode,
            PAccNo: payment.accno,
            PAccNowith0: payment.objectcode || '',
            PNarration: payment.narration,
            PCashAmount: payment.cashamount,
            PBankAmount: payment.bankamount,
            PChqNo: payment.chqno,
            PTransferAmount: payment.transamount,
            PAccname: payment.accname || '',
            PartyName: payment.partyname || '',
            PaymentTotal: 0
          });
        }
      }
    }
  });
  return mergedData;
}

// async function getOpeningBalance(filters) {
//   console.log("Repo: Fetch Opening Balance", filters);
//   const cashBankSubTypes = [4810, 4820, 4821, 4822, 4823, 4830];
  
//   console.log(`Opening Balance As On: ${filters.date}`);
  
//   let sql = `
//     SELECT balance + receiptamt - amount AS opening_balance 
//     FROM (
//         SELECT NVL(SUM(openingbal + (
//             SELECT NVL(SUM(amount), 0) 
//             FROM transview a 
//             WHERE a.glcode = c.glcode 
//               AND a.accno = c.accno 
//               AND TRUNC(a.trnsdate) <= TO_DATE('${filters.date}', 'DD-MON-YYYY')
//         )), 0) AS balance 
//         FROM accountview_web c 
//         INNER JOIN aoac_budgetaccmap_det bd 
//             ON bd.num_budgetaccmap_glcode = c.glcode 
//             AND bd.num_budgetaccmap_accountno = c.accno   
//         INNER JOIN aoac_budgetconfig_det b 
//             ON num_budgetconfig_headid = num_budgetaccmap_subgroup 
//             AND num_budgetconfig_level = 1 
//         WHERE c.accsubtypeid IN (${cashBankSubTypes.join(',')})  
//           AND c.ulbid = '${filters.ulbId}'
//     ) balance, 
    
//     (
//         SELECT NVL(SUM(amount), 0) AS amount 
//         FROM transview c 
//         INNER JOIN accountview_web a 
//             ON a.glcode = c.glcode AND a.accno = c.accno AND c.ulbid = a.ulbid 
//         WHERE a.accsubtypeid IN (4829) 
//           AND c.ulbid = '${filters.ulbId}'  
//           AND TRUNC(c.trnsdate) <= TO_DATE('${filters.date}', 'DD-MON-YYYY')
//   `;
  
//   if (filters.zone && filters.zone !== "-1") {
//     sql += `\n          AND c.zoneid = '${filters.zone}'`;
//   }
  
//   sql += `
//     ) amount, 
    
//     (
//         SELECT NVL(SUM(amount), 0) AS receiptamt 
//         FROM transview a 
//         INNER JOIN accountview_web c 
//             ON a.glcode = c.glcode AND a.accno = c.accno 
//         WHERE TRUNC(a.trnsdate) <= TO_DATE('${filters.date}', 'DD-MON-YYYY')  
//           AND a.ulbid = '${filters.ulbId}' 
//   `;
  
//   if (filters.zone && filters.zone !== "-1") {
//     sql += `\n          AND a.zoneid = '${filters.zone}'`;
//   }
  
//   sql += `
//           AND a.transno IN (
//               SELECT a.transno 
//               FROM transview a 
//               INNER JOIN accountview_web c 
//                   ON a.glcode = c.glcode AND a.accno = c.accno 
//               WHERE TRUNC(a.trnsdate) <= TO_DATE('${filters.date}', 'DD-MON-YYYY') 
//                 AND c.accsubtypeid IN (${cashBankSubTypes.join(',')})  
//                 AND c.ulbid = '${filters.ulbId}'
//   `;
  
//   if (filters.zone && filters.zone !== "-1") {
//     sql += `\n                AND a.zoneid = '${filters.zone}'`;
//   }
  
//   sql += `
//               ) 
//               AND a.amount > 0
//     ) receiptamt
//   `;
  
//   console.log(sql);
  
//   try {
//     const result = await executeQuery(sql, {});
    
//     console.log("Query Result:", result);
    
//     if (!result.success) {
//       console.error("SQL Error:", result.error);
//       throw new Error(result.error);
//     }
    
//     const openingBalance = result.rows[0]?.OPENING_BALANCE || 0;
//     console.log(`Calculated Opening Balance: ${openingBalance}`);
    
//     return openingBalance;
    
//   } catch (error) {
//     console.error("Error in getOpeningBalance:", error);
//     throw error;
//   }
// }

async function getOpeningBalance(filters) {
  console.log("Repo: Fetch Opening Balance", filters);
  
  const cashBankSubTypes = [4820, 4810, 4821, 4822, 4823, 4830];
  const transferSubType = 4829;
  
  console.log(`Opening Balance As On: ${filters.date}`);
  
  let sql = `
    SELECT balance + receiptamt - amount AS opening_balance 
    FROM (
        -- Opening Balance Subquery (multiplied by -1 as per logic)
        SELECT NVL(SUM(openingbal) * -1, 0) AS balance 
        FROM accountview_web c 
        WHERE c.accsubtypeid IN (${cashBankSubTypes.join(',')})  
          AND c.ulbid = '${filters.ulbId}'
    ) balance,
    
    (
        -- Amount Subquery (Transfer amounts)
        SELECT NVL(SUM(amount), 0) AS amount 
        FROM transview c 
        INNER JOIN accountview_web a 
            ON a.glcode = c.glcode 
            AND a.accno = c.accno 
            AND c.ulbid = a.ulbid 
        WHERE a.accsubtypeid IN (${transferSubType}) 
          AND c.ulbid = '${filters.ulbId}'  
          AND TRUNC(c.trnsdate) <= TO_DATE('${filters.date}', 'DD-MON-YYYY')
  `;
  
  if (filters.zone && filters.zone !== "-1") {
    sql += `\n          AND c.zoneid = '${filters.zone}'`;
  }
  
  sql += `
    ) amount,
    
    (
        -- Receipt Amount Subquery
        SELECT NVL(SUM(amount), 0) AS receiptamt 
        FROM transview a 
        INNER JOIN accountview_web c 
            ON a.glcode = c.glcode 
            AND a.accno = c.accno 
            AND c.ulbid = a.ulbid 
        WHERE TRUNC(a.trnsdate) <= TO_DATE('${filters.date}', 'DD-MON-YYYY')  
          AND a.ulbid = '${filters.ulbId}'
  `;
  
  if (filters.zone && filters.zone !== "-1") {
    sql += `\n          AND a.zoneid = '${filters.zone}'`;
  }
  
  sql += `
          AND a.transno IN (
              -- Subquery to filter cash/bank transactions
              SELECT a.transno 
              FROM transview a 
              INNER JOIN accountview_web c 
                  ON a.glcode = c.glcode 
                  AND a.accno = c.accno 
                  AND c.ulbid = a.ulbid 
              WHERE TRUNC(a.trnsdate) <= TO_DATE('${filters.date}', 'DD-MON-YYYY') 
                AND c.accsubtypeid IN (${cashBankSubTypes.join(',')})  
                AND c.ulbid = '${filters.ulbId}'
  `;
  
  // Add zone filter in subquery if provided and not "-1"
  if (filters.zone && filters.zone !== "-1") {
    sql += `\n                AND a.zoneid = '${filters.zone}'`;
  }
  
  sql += `
              ) 
              AND a.amount > 0
    ) receiptamt
  `;
  
  console.log("Generated SQL Query:", sql);
  
  try {
    const result = await executeQuery(sql, {});
    
    console.log("Query Result:", result);
    
    if (!result.success) {
      console.error("SQL Error:", result.error);
      throw new Error(result.error);
    }
    
    const openingBalance = result.rows[0]?.OPENING_BALANCE || 0;
    console.log(`Calculated Opening Balance: ${openingBalance}`);
    
    return openingBalance;
    
  } catch (error) {
    console.error("Error in getOpeningBalance:", error);
    throw error;
  }
}

async function getReceiptTransactionDetails(transNo, ulbId) {
  console.log("📤 Repo: Fetch Receipt Transaction Details", { transNo, ulbId });
  
  const sql = `
    SELECT 
      num_receiptmst_refno as refno,
      num_receiptmst_trnstypeid as trnstype
    FROM aoac_receiptmst_def 
    WHERE num_receiptmst_trnsno = :transNo 
      AND num_receiptmst_ulbid = :ulbId
  `;
  
  const params = { transNo, ulbId };
  const result = await executeQuery(sql, params);
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.rows[0] || null;
}

async function getPaymentTransactionDetails(transNo, ulbId) {
  console.log("📤 Repo: Fetch Payment Transaction Details", { transNo, ulbId });
  
  const sql = `
    SELECT 
      num_payment_refno as refno,
      num_payment_trnstype as trnstype
    FROM aoac_payment_def 
    WHERE num_payment_trnsno = :transNo 
      AND num_payment_ulbid = :ulbId
  `;
  
  const params = { transNo, ulbId };
  const result = await executeQuery(sql, params);
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.rows[0] || null;
}

async function getTransferTransactionDetails(transNo, ulbId) {
  console.log("📤 Repo: Fetch Transfer Transaction Details", { transNo, ulbId });
  
  const sql = `
    SELECT 
      num_transfer_refno as refno,
      5 as trnstype
    FROM aoac_transfer_def 
    WHERE num_transfer_trnsno = :transNo 
      AND num_transfer_ulbid = :ulbId
  `;
  
  const params = { transNo, ulbId };
  const result = await executeQuery(sql, params);
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.rows[0] || null;
}

module.exports = {
  getGrampanchayatListRepo,
  getCashBankBalanceReportRepo,
  getDailyTransactionDetailedReport,
  getOpeningBalance,
  getReceiptTransactionDetails,
  getPaymentTransactionDetails,
  getTransferTransactionDetails
};