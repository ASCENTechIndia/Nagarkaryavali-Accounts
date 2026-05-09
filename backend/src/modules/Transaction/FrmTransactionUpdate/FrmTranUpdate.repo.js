const { executeQuery } = require("../../../db/queryExecutor");
const oracledb = require("oracledb");
const { executeProcedure } = require("../../../db/procedureExecutor");


const getVchGenTransView = async (filters) => {
  const query = `
    SELECT 
        tt.var_trnstype_trnstype AS trnstype, 
        a.trnsdate, 
        a.transno, 
        a.docno, 
        a.glcode, 
        acc.glname, 
        a.accno, 
        acc.accname, 
        a.ulbid, 
        vwz.zoneename, 
        gp.var_grampanch_grampanch AS grampanch, 
        CASE WHEN a.amount > 0 THEN a.amount ELSE 0 END AS credit, 
        CASE WHEN a.amount < 0 THEN a.amount * -1 ELSE 0 END AS debit, 
        0 AS BudgetCode,
        p.var_partymst_partyname AS PartyName,
        a.narration 
    FROM vch_gen_transview a 
    INNER JOIN accountview acc 
        ON a.glcode = acc.glcode 
        AND a.accno = acc.accno 
        AND acc.ulbid = a.ulbid
    INNER JOIN view_zone vwz 
        ON vwz.zoneid = a.zoneid 
        AND vwz.corpid = a.ulbid 
    LEFT OUTER JOIN aoac_grampanch_def gp 
        ON gp.num_grampanch_grampanchid = a.grampanchid 
    LEFT OUTER JOIN aoac_partymst_def p 
        ON p.num_partymst_partyid = a.partycode 
        AND p.num_partymst_ulbid = a.ulbid 
    LEFT OUTER JOIN aoac_trnstype_def tt 
        ON tt.num_trnstype_trnstypeid = a.trnstypeid 
    WHERE a.transno = :transno
      AND a.ulbid = :ulbid
    ORDER BY a.trnsdate, a.transno, a.amount DESC
  `;

  return await executeQuery(query, {
    transno: filters.transno,
    ulbid: filters.ulbid,
  });
};


const getTransView = async (filters) => {
  const query = `
    SELECT 
        tt.var_trnstype_trnstype AS trnstype, 
        a.trnsdate, 
        a.transno, 
        a.docno, 
        a.glcode, 
        acc.glname, 
        a.accno, 
        acc.accname, 
        a.ulbid, 
        vwz.zoneename, 
        gp.var_grampanch_grampanch AS grampanch, 
        CASE WHEN a.amount > 0 THEN a.amount ELSE 0 END AS credit, 
        CASE WHEN a.amount < 0 THEN a.amount * -1 ELSE 0 END AS debit, 
        0 AS BudgetCode,
        p.var_partymst_partyname AS PartyName,
        a.narration 
    FROM transview a 
    INNER JOIN accountview acc 
        ON a.glcode = acc.glcode 
        AND a.accno = acc.accno 
        AND acc.ulbid = a.ulbid
    INNER JOIN view_zone vwz 
        ON vwz.zoneid = a.zoneid 
        AND vwz.corpid = a.ulbid 
    LEFT OUTER JOIN aoac_grampanch_def gp 
        ON gp.num_grampanch_grampanchid = a.grampanchid 
    LEFT OUTER JOIN aoac_partymst_def p 
        ON p.num_partymst_partyid = a.partycode 
        AND p.num_partymst_ulbid = a.ulbid 
    LEFT OUTER JOIN aoac_trnstype_def tt 
        ON tt.num_trnstype_trnstypeid = a.trnstypeid 
    WHERE a.transno = :transno
      AND a.ulbid = :ulbid
    ORDER BY a.trnsdate, a.transno, a.amount DESC
  `;

  return await executeQuery(query, {
    transno: filters.transno,
    ulbid: filters.ulbid,
  });
};

async function deleteTransaction(payload) {
  console.log("📤 Repo: Execute Delete Transaction Procedure", payload);

  const sql = `
    BEGIN
      aoac_trns_delete(
        :in_userid,
        :in_transno,
        :in_mode,
        :in_Remarks,
        :in_delrevflag,
        :out_ErrorCode,
        :out_ErrorMsg
      );
    END;
  `;

  const binds = {
    in_userid: payload.userid,
    in_transno: payload.transno,
    in_mode: payload.mode,
    in_Remarks: payload.remarks,
    in_delrevflag: payload.delrevflag,

    out_ErrorCode: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },

    out_ErrorMsg: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 1000,
    },
  };

  const result = await executeProcedure({ sql, binds });

  console.log("✅ Procedure Result:", result);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.outBinds;
}
async function getRevokeListRepo(payload) {
  console.log("📤 Repo: Get Revoke List", payload);

  const viewMap = {
    receipt: {
      view: "vw_recrevoke",
      flagColumn: "RECEIPTFLAG",
    },
    payment: {
      view: "vw_payrevoke",
      flagColumn: "PAYMENTFLAG",
    },
    transfer: {
      view: "vw_transrevoke",
      flagColumn: "TRANSFERFLAG",
    },
    voucher: {
      view: "vw_vchrevoke",
      flagColumn: "VCHTRANSFLAG",
    },
  };

  const config = viewMap[payload.type];

  if (!config) {
    throw new Error("Invalid revoke type");
  }

  const query = `
    SELECT 
        RevokeDate,
        Transtype,
        transno,
        recno,
        transdate,
        MajorCode,
        MinorCode,
        MinorCodeName,
        ZoneName,
        ChequeNo,
        ChequeDate,
        Tapshil,
        PartyName,
        ArthSankalp,
        insby,
        Amount,
        revokeRemark,
        RevokeBy
    FROM ${config.view}
    WHERE transdate >= TO_DATE(:fromDate, 'DD-MON-YYYY')
      AND transdate <= TO_DATE(:toDate, 'DD-MON-YYYY')
      AND ulbid = :ulbid
      AND ${config.flagColumn} = :flag
    ORDER BY RevokeDate, transdate
  `;

  return await executeQuery(query, {
    fromDate: payload.fromDate,
    toDate: payload.toDate,
    ulbid: payload.ulbid,
    flag: payload.flag,
  });
}

module.exports = {
  getVchGenTransView,
  getTransView,
  deleteTransaction,
  getRevokeListRepo,
};