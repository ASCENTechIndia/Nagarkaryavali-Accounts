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

  // ================= MBMC FILTER =================
  let mbmcFilter1 = "";
  let mbmcFilter2 = "";
  let mbmcFilter3 = "";
  let mbmcFilter4 = "";
  let mbmcFilter5 = "";

  if (corpCode === "MBMC") {
    if (budgetId && budgetId !== 0 && budgetId !== "0") {
      mbmcFilter1 += " AND a.budgetid = :budgetId ";
      mbmcFilter2 += " AND num_trans_budgetid = :budgetId ";
      mbmcFilter3 += " AND num_trans_budgetid = :budgetId ";
      mbmcFilter4 += " AND budgetid = :budgetId ";
      mbmcFilter5 += " AND budgetid = :budgetId ";
      params.budgetId = budgetId;
    }
    if (nidhiId && nidhiId !== 0 && nidhiId !== "0") {
      mbmcFilter1 += " AND a.nidhi_id = :nidhiId ";
      mbmcFilter2 += " AND num_trans_nidhiid = :nidhiId ";
      mbmcFilter3 += " AND num_trans_nidhiid = :nidhiId ";
      mbmcFilter4 += " AND a.nidhi_id = :nidhiId ";
      mbmcFilter5 += " AND a.nidhi_id = :nidhiId ";
      params.nidhiId = nidhiId;
    }
  }

  // ================= ZONE FILTER =================
  let zoneFilter1 = "";
  let zoneFilter2 = "";
  let zoneFilter3 = "";
  let zoneFilter4 = "";
  let zoneFilter5 = "";

  if (zone && zone !== "-1") {
    zoneFilter1 = " AND a.zoneid = :zone ";
    zoneFilter2 = " AND num_vchprepmst_zoneid = :zone ";
    zoneFilter3 = " AND num_vchprepmst_zoneid = :zone ";
    zoneFilter4 = " AND a.zoneid = :zone ";
    zoneFilter5 = " AND a.zoneid = :zone ";
    params.zone = zone;
  } else {
    zoneFilter1 = " AND c.ulbid = :ulbId ";
    zoneFilter2 = " AND c.ulbid = :ulbId ";
    zoneFilter3 = " AND c.ulbid = :ulbId ";
    zoneFilter4 = " AND c.ulbid = :ulbId ";
    zoneFilter5 = " AND c.ulbid = :ulbId ";
  }

  const sql = `
  SELECT * FROM (

    /* ================= RECEIPTS ================= */
    SELECT 
      a.transno, a.trnsdate, a.docno, a.glcode, a.accno,
      a.narration,
      CASE WHEN a.trnstypeid = 1 THEN a.amount ELSE 0 END cashamount,
      CASE WHEN a.trnstypeid = 2 THEN a.amount ELSE 0 END bankamount,
      'R' AS TRANSTYPE,
      TO_CHAR(a.chqno,'FM000000') chqno,
      CASE WHEN a.sourceid = 6 THEN a.amount ELSE 0 END transamount,
      v.zoneename,
      d.num_accdept_name grampanch,
      c.objectcode||' '||c.accname accname,
      p.var_partymst_partyname PARTYNAME,
      NULL DelFlag,
      c.objectcode,
      c.functioncode

    FROM transview a
    INNER JOIN accountview_web c ON a.glcode=c.glcode AND a.accno=c.accno AND c.ulbid=a.ulbid
    LEFT JOIN aoac_partymst_def p ON p.num_partymst_partyid = a.partycode
    LEFT JOIN view_zone v ON v.zoneid = a.zoneid
    LEFT JOIN aoac_accdept_mst d ON d.num_accdept_id = a.accdept

    WHERE TRUNC(a.trnsdate)=TO_DATE(:reportDate,'DD-MON-YYYY')
      AND a.amount>0
      AND (a.trnstypeid IN (1,2)
      OR (a.sourceid=6 AND c.accsubtypeid NOT IN (4820,4821,4822,4823,4829)))
      ${mbmcFilter1}
      ${zoneFilter1}

    UNION ALL

    /* ================= BANK PAYMENTS ================= */
    SELECT 
      num_vchprepmst_trnsno,
      date_trans_trnsdate,
      (SELECT DISTINCT TO_CHAR(num_vchtransbal_vchtransbalno)
       FROM aoac_vchtransbal_def 
       WHERE num_vchtransbal_transno=num_trans_transno),
      num_vchprepmst_drgl,
      num_vchprepmst_dracc,
      var_vchpremst_narration,
      0,
      SUM(num_vchgenmst_payamt),
      'P',
      TO_CHAR(num_trans_chqno,'FM000000'),
      0,
      NULL,NULL,
      c.objectcode||' '||c.accname,
      p.var_partymst_partyname,
      NULL,
      c.objectcode,
      c.functioncode

    FROM aoac_vchprepmst_def
    LEFT JOIN aoac_vchprepdet_def ON num_vchprepdet_refno=num_vchprepmst_refno
    INNER JOIN aoac_vchgenmst_def ON num_vchgenmst_refno=num_vchprepmst_refno
    INNER JOIN accountview_web c ON c.glcode=num_vchprepmst_drgl AND c.accno=num_vchprepmst_dracc AND c.ulbid=num_vchpremst_ulbid
    LEFT JOIN aoac_partymst_def p ON p.num_partymst_partyid=num_vchprepmst_partyid
    INNER JOIN aoac_trans_def ON num_vchprepmst_trnsno=num_trans_transno

    WHERE TRUNC(date_trans_trnsdate)=TO_DATE(:reportDate,'DD-MON-YYYY')
      ${zoneFilter2}
      ${mbmcFilter2}

    GROUP BY num_vchprepmst_trnsno,date_trans_trnsdate,num_vchprepmst_vchno,
             num_vchprepmst_drgl,num_vchprepmst_dracc,
             var_vchpremst_narration,num_trans_chqno,
             c.objectcode,c.accname,c.functioncode,p.var_partymst_partyname,num_trans_transno

    UNION ALL

    /* ================= TRANSFER AMOUNT ================= */
    SELECT 
      num_vchprepmst_trnsno,
      date_trans_trnsdate,
      (SELECT DISTINCT TO_CHAR(num_vchtransbal_vchtransbalno)
       FROM aoac_vchtransbal_def 
       WHERE num_vchtransbal_transno=num_trans_transno),
      num_vchprepmst_drgl,
      num_vchprepmst_dracc,
      var_vchpremst_narration,
      0,
      0,
      'P',
      TO_CHAR(num_trans_chqno,'FM000000'),
      NVL(num_vchprepdet_amt,0),
      NULL,NULL,
      c.objectcode||' '||c.accname,
      p.var_partymst_partyname,
      NULL,
      c.objectcode,
      c.functioncode

    FROM aoac_vchprepmst_def
    LEFT JOIN aoac_vchprepdet_def ON num_vchprepdet_refno=num_vchprepmst_refno
    INNER JOIN accountview_web c ON c.glcode=num_vchprepdet_glcode AND c.accno=num_vchprepdet_accno AND c.ulbid=num_vchpremst_ulbid
    LEFT JOIN aoac_partymst_def p ON p.num_partymst_partyid=num_vchprepmst_partyid
    INNER JOIN aoac_trans_def ON num_vchprepmst_trnsno=num_trans_transno

    WHERE TRUNC(date_trans_trnsdate)=TO_DATE(:reportDate,'DD-MON-YYYY')
      ${zoneFilter3}
      ${mbmcFilter3}

    UNION ALL

    /* ================= DIRECT PAYMENTS ================= */
    SELECT 
      a.transno,a.trnsdate,a.docno,a.glcode,a.accno,
      p.var_partymst_partyname||' '||c.accname||' '||a.narration,
      CASE WHEN a.trnstypeid=3 THEN a.amount ELSE 0 END,
      CASE WHEN a.trnstypeid=4 THEN a.amount ELSE 0 END,
      'P',
      TO_CHAR(a.chqno,'FM000000'),
      CASE WHEN a.trnstypeid=8 THEN a.amount ELSE 0 END,
      v.zoneename,d.num_accdept_name,
      c.objectcode||' '||c.accname,
      p.var_partymst_partyname,
      NULL,
      c.objectcode,
      c.functioncode

    FROM transview a
    INNER JOIN accountview_web c ON a.glcode=c.glcode AND a.accno=c.accno AND c.ulbid=a.ulbid
    LEFT JOIN aoac_partymst_def p ON p.num_partymst_partyid=a.partycode
    LEFT JOIN view_zone v ON v.zoneid=a.zoneid
    LEFT JOIN aoac_accdept_mst d ON d.num_accdept_id=a.accdept

    WHERE TRUNC(a.trnsdate)=TO_DATE(:reportDate,'DD-MON-YYYY')
      AND a.amount<0 AND a.trnstypeid IN (3,4)
      AND a.sourceid <> 6
      ${mbmcFilter4}
      ${zoneFilter4}

    UNION ALL

    /* ================= TYPE 9 ================= */
    SELECT 
      a.transno,a.trnsdate,a.docno,a.glcode,a.accno,
      p.var_partymst_partyname||' '||c.accname||' '||a.narration,
      0,0,
      'P',
      TO_CHAR(a.chqno,'FM000000'),
      CASE WHEN a.trnstypeid=9 THEN a.amount ELSE 0 END,
      v.zoneename,d.num_accdept_name,
      c.objectcode||' '||c.accname,
      p.var_partymst_partyname,
      NULL,
      c.objectcode,
      c.functioncode

    FROM transview a
    INNER JOIN accountview_web c ON a.glcode=c.glcode AND a.accno=c.accno AND c.ulbid=a.ulbid
    LEFT JOIN aoac_partymst_def p ON p.num_partymst_partyid=a.partycode
    LEFT JOIN view_zone v ON v.zoneid=a.zoneid
    LEFT JOIN aoac_accdept_mst d ON d.num_accdept_id=a.accdept

    WHERE TRUNC(a.trnsdate)=TO_DATE(:reportDate,'DD-MON-YYYY')
      AND a.amount>0 AND a.trnstypeid=9
      AND a.sourceid <> 6
      ${mbmcFilter5}
      ${zoneFilter5}

  )
  ORDER BY TRANSTYPE DESC, transno, docno, transamount
  `;

  console.log("Executing SQL with params:", params);
  
  const result = await executeQuery(sql, params);

  if (!result.success) throw new Error(result.error);

  console.log("Raw SQL result rows count:", result.rows?.length);
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
    
    console.log(`Item ${index}: TRANSTYPE = ${transType}`);
    
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
        zonename: item.ZONEENAME || item.zoneename,
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
        zonename: item.ZONEENAME || item.zoneename,
        grampanch: item.GRAMPANCH || item.grampanch,
        accname: item.ACCNAME || item.accname,
        partyname: item.PARTYNAME || item.partyname,
        objectcode: item.OBJECTCODE || item.objectcode,
        functioncode: item.FUNCTIONCODE || item.functioncode
      });
    }
  });

  console.log(`Receipts count: ${receipts.length}, Payments count: ${payments.length}`);

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
          // Payment fields (empty)
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
            // Payment fields
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

  console.log("Merged data count:", mergedData.length);
  
  return mergedData;
}

async function getOpeningBalance(filters) {
  console.log("📤 Repo: Fetch Opening Balance", filters);
  
  const cashBankSubTypes = [4820, 4821, 4822, 4823, 17, 4829]; 
  
  let sql = `
    SELECT balance + receiptamt - amount AS balance FROM (
      SELECT NVL(SUM(openingbal), 0) AS balance 
      FROM accountview_web c 
      WHERE c.accsubtypeid IN (${cashBankSubTypes.join(',')})
        AND c.ulbid = '${filters.ulbId}'
    ) balance,
    (
      SELECT NVL(SUM(amount), 0) AS amount 
      FROM transview c 
      INNER JOIN accountview_web a 
        ON a.glcode = c.glcode AND a.accno = c.accno AND c.ulbid = a.ulbid 
      WHERE a.accsubtypeid IN (4829) 
        AND c.ulbid = '${filters.ulbId}'  
        AND TRUNC(c.trnsdate) <= TO_DATE('${filters.date}', 'DD-MON-YYYY')
  `;
  
  if (filters.zone && filters.zone !== "-1") {
    sql += ` AND c.zoneid = '${filters.zone}'`;
  }
  
  sql += ` ) amount,
    (
      SELECT NVL(SUM(amount), 0) AS receiptamt 
      FROM transview a 
      INNER JOIN accountview_web c 
        ON a.glcode = c.glcode AND a.accno = c.accno 
      WHERE TRUNC(a.trnsdate) <= TO_DATE('${filters.date}', 'DD-MON-YYYY')
        AND c.ulbid = '${filters.ulbId}' 
  `;
  
  if (filters.zone && filters.zone !== "-1") {
    sql += ` AND a.zoneid = '${filters.zone}'`;
  }
  
  sql += `
        AND a.transno IN (
          SELECT a.transno 
          FROM transview a 
          INNER JOIN accountview_web c 
            ON a.glcode = c.glcode AND a.accno = c.accno 
          WHERE TRUNC(a.trnsdate) <= TO_DATE('${filters.date}', 'DD-MON-YYYY')
            AND c.accsubtypeid IN (${cashBankSubTypes.join(',')})
            AND c.ulbid = '${filters.ulbId}'
  `;
  
  if (filters.zone && filters.zone !== "-1") {
    sql += ` AND a.zoneid = '${filters.zone}'`;
  }
  
  sql += `
        ) 
        AND a.amount > 0
    ) receiptamt
  `;
  
  console.log("Generated SQL:", sql);
  
  const result = await executeQuery(sql, {});
  
  console.log("Result: ", result);

  if (!result.success) {
    console.error("SQL Error:", result.error);
    throw new Error(result.error);
  }
  
  const balance = result.rows[0]?.BALANCE || 0;
  console.log("Calculated balance:", balance);
  
  return balance;
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