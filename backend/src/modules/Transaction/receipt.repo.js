
const oracledb = require("oracledb");
const { withTx } = require("../../db/tx");
const { executeQuery } = require("../../db/queryExecutor");


const getReceiptListRepo = (ddl_ZoneID, ddl_ULB_ID) => executeQuery(
`SELECT num_receiptmst_refno refno,
        date_receiptmst_trnsdate trnsdate,
        num_receiptmst_recno docno,
        var_trnstype_trnstypemar trnstype,
        zoneename zonename,
        var_grampanch_grampanch grampanch,
        SUM(num_receiptdet_amount) amount,
        var_receiptmst_insby username,
        date_receiptmst_insdate datetime,
        num_receiptmst_trnstypeid trnstypeid
 FROM aoac_receiptmst_def
 INNER JOIN aoac_receiptdet_def
   ON num_receiptdet_refno = num_receiptmst_refno
 INNER JOIN aoac_trnstype_def
   ON num_trnstype_trnstypeid = num_receiptmst_trnstypeid
 INNER JOIN view_zone
   ON zoneid = num_receiptmst_zoneid
 LEFT JOIN aoac_grampanch_def
   ON num_grampanch_deptid = num_receiptmst_zoneid
  AND num_grampanch_grampanchid = num_receiptmst_grampanchid
 WHERE var_receiptmst_authstatus IS NULL
   AND zoneid = :ddl_ZoneID
   AND num_receiptmst_ulbid = :ddl_ULB_ID
 GROUP BY num_receiptmst_refno,
          date_receiptmst_trnsdate,
          num_receiptmst_recno,
          var_trnstype_trnstypemar,
          zoneename,
          var_grampanch_grampanch,
          var_receiptmst_insby,
          date_receiptmst_insdate,
          num_receiptmst_trnstypeid
 ORDER BY num_receiptmst_refno`,
{ ddl_ZoneID, ddl_ULB_ID }
);

const getZonesRepo = (corp_id) =>
    executeQuery(`select zoneename,zoneid from view_zone where corpid=:corp_id`, { corp_id });

const getCorporationRepo = (corp_id) =>
    executeQuery(`SELECT var_corporation_name CorporationName,
                         num_corporation_id CorporationID
                  FROM admins.aoma_corporation_mas
                  WHERE num_corporation_id=:corp_id`, { corp_id });

const getDepartmentsRepo = (ulbid) =>
    executeQuery(`select deptname,deptid from vw_accdeptconfig where ulbid=:ulbid`, { ulbid });

const getBudgetHeadsRepo = () =>
    executeQuery(`select var_budgetconfig_budgetname,
                         num_budgetconfig_headid
                  from aoac_budgetconfig_det
                  where num_budgetconfig_level=1`);

const getNarrationRepo = () =>
    executeQuery(`select var_narration_remark
                  from aoac_narration_mst
                  where var_narration_type='R'
                  order by var_narration_type`);

const getTransTypeRepo = () =>
    executeQuery(`SELECT var_trnstype_trnstype DisplayText,
                         num_trnstype_trnstypeid ValueField
                  FROM aoac_trnstype_def
                  WHERE num_trnstype_trnstypeid IN (1,2)`);

const getDeptMasterRepo = () =>
    executeQuery(`SELECT var_deptmst_deptname DisplayText,
                         num_deptmst_deptid ValueField
                  FROM aoac_deptmst_def`);

const getReceiptDetailsRepo = (RefNo) =>
    executeQuery(`SELECT * FROM aoac_receiptmst_def WHERE num_receiptmst_refno=:RefNo`, { RefNo });

const getGrampanchRepo = (ZoneId) =>
    executeQuery(`SELECT num_grampanch_grampanchid ValueID,
                         var_grampanch_marathiname DisplayName
                  FROM aoac_grampanch_def
                  WHERE num_grampanch_deptid=:ZoneId`, { ZoneId });

const getPartyRepo = (ulbid) =>
    executeQuery(`select num_partymst_partyid||'-'||var_partymst_partyname partyname,
                         num_partymst_partyid
                  from aoac_partymst_def
                  where num_partymst_ulbid=:ulbid`, { ulbid });

const getAccountNameRepo = (glcode, accno) =>
    executeQuery(`select accname, accsubtypeid
                  from accountview_web
                  where glcode=:glcode and accno=:accno`, { glcode, accno });

// PROCEDURE
const receiptInsertUpdateRepo = async (data) => {
  try {
    const result = await withTx(async (conn) => {

      const res = await conn.execute(
        `BEGIN 
            aoac_receipt_ins(
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
    getReceiptListRepo,
    getZonesRepo,
    getCorporationRepo,
    getDepartmentsRepo,
    getBudgetHeadsRepo,
    getNarrationRepo,
    getTransTypeRepo,
    getDeptMasterRepo,
    getReceiptDetailsRepo,
    getGrampanchRepo,
    getPartyRepo,
    getAccountNameRepo,
    receiptInsertUpdateRepo
};