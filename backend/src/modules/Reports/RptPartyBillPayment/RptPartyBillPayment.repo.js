const { executeQuery } = require("../../../db/queryExecutor");

const getPartyBillPayment = async (params) => {
  try {
    let query = `
      SELECT 
        transno,
        trnsdate,
        partyname,
        narration,
        chqno,
        chqdate,
        amount
      FROM view_partybill_det
      WHERE 
        TRUNC(trnsdate) BETWEEN 
          TO_DATE(:FromDate,'YYYY-MM-DD') 
          AND TO_DATE(:ToDate,'YYYY-MM-DD')
        AND ulbid = :UlbId
    `;

    let bindParams = {
      FromDate: params.fromDate,
      ToDate: params.toDate,
      UlbId: params.ulbId,
    };

    // ✅ Party filter
    if (params.partyId && params.partyId !== "0") {
      query += ` AND party_id = :PartyId`;
      bindParams.PartyId = params.partyId;
    }

    return await executeQuery(query, bindParams);
  } catch (err) {
    throw err;
  }
};

// ================= FORM 64 =================
const getForm64Report = async (params) => {
  try {
    const query = `
      SELECT 
        refno,
        billno,
        billdate,
        partyname,
        pancard,
        expenditurehead,
        expenditurecode,
        expenditureamount,
        deductioncode,
        deductionheaddescription,
        deductionamount,
        expremark,
        departname,
        pv_date,
        chequeno
      FROM view_partybill_form64rpt
      WHERE refno = :RefNo
        AND ulbid = :UlbId
    `;

    const bindParams = {
      RefNo: params.refNo,
      UlbId: params.ulbId,
    };

    return await executeQuery(query, bindParams);
  } catch (err) {
    throw err;
  }
};

// ================= FORM 63 =================
const getForm63Report = async (params) => {
  try {
    const query = `
      SELECT 
        b.refno,
        billno,
        billdate,
        partyname,
        pancard,
        expenditurehead,
        expenditurecode,
        expenditureamount,
        deductionheaddescription,
        b.deductionamount,
        expremark,
        (expenditureamount - a.deductionamount) total
      FROM view_partybill_form63rpt b
      INNER JOIN view_partybillsum a 
        ON a.refno = b.refno 
        AND a.ulbid = b.ulbid
      WHERE b.refno = :RefNo
        AND b.ulbid = :UlbId
    `;

    const bindParams = {
      RefNo: params.refNo,
      UlbId: params.ulbId,
    };

    return await executeQuery(query, bindParams);
  } catch (err) {
    throw err;
  }
};

module.exports = { getPartyBillPayment, getForm63Report, getForm64Report };
