const { executeQuery } = require("../../../db/queryExecutor");

const getGovtTaxRegister1 = async (params) => {
    try {

        // ================= MAIN WHERE CONDITIONS =================
        const conditions = [
            `TRUNC(date_vchtrans_trnsdate) BETWEEN TO_DATE(:fromDate,'YYYY-MM-DD') AND TO_DATE(:toDate,'YYYY-MM-DD')`,
            `vm.num_vchpremst_ulbid = :ulbId`
        ];

        const bind = {
            fromDate: params.fromDate,
            toDate: params.toDate,
            ulbId: params.ulbId
        };

        // ================= OPTIONAL FILTERS =================
        if (params.zoneId && params.zoneId !== "-1" && params.zoneId !=="") {
            conditions.push(`vz.zoneid = :zoneId`);
            bind.zoneId = params.zoneId;
        }

        if (params.partyId && params.partyId !== "-1" && params.partyId !=="") {
            conditions.push(`vm.num_vchprepmst_partyid = :partyId`);
            bind.partyId = params.partyId;
        }

        if (params.majorCode && params.majorCode !=="") {
            conditions.push(`vd.num_vchprepdet_glcode = :majorCode`);
            bind.majorCode = params.majorCode;
        }

        if (params.minorCode && params.minorCode !=="") {
            conditions.push(`vd.num_vchprepdet_accno = :minorCode`);
            bind.minorCode = params.minorCode;
        }

        if (params.bankGl && params.bankGl !=="") {
            conditions.push(`vt.num_vchtrans_glcode = :bankGl`);
            bind.bankGl = params.bankGl;
        }

        if (params.bankAcc && params.bankAcc !=="") {
            conditions.push(`vt.num_vchtrans_accno = :bankAcc`);
            bind.bankAcc = params.bankAcc;
        }

        const whereClause = conditions.join(" AND ");

        // ================= SUBQUERY CONDITIONS (IMPORTANT) =================
        const subConditions = [
            `num_vchtransbaldet_vchrefno = vd.num_vchprepdet_refno`,
            `num_vchtransbaldet_transno = vt.num_vchtrans_vchtransno`,
            `num_vchtransbaldet_amount > 0`
        ];

        // apply same filters inside subquery
        if (params.majorCode && params.majorCode !=="") {
            subConditions.push(`num_vchtransbaldet_glcode = :majorCode`);
        }

        if (params.minorCode && params.minorCode !=="") {
            subConditions.push(`num_vchtransbaldet_accno = :minorCode`);
        }

        const subWhere = subConditions.join(" AND ");

        // ================= FINAL QUERY =================
        const query = `
      SELECT 
          zoneid,
          zoneename,
          num_vchprepmst_partyid,
          var_partymst_partyname AS partyname,
          num_vchtrans_vchtransno AS voucherno,
          num_vchtransbal_transno AS transno,
          date_vchtrans_trnsdate AS transdt,

          aws.accno || '-' || aws.accname AS bankname,
          vt.num_vchtrans_accno AS bankac,
          vt.num_vchtrans_glcode AS bankgl,

          NVL(
              (
                  SELECT SUM(num_vchtransbaldet_amount)
                  FROM aoac_vchtransbaldet_def
                  WHERE ${subWhere}
              ), 0
          ) AS taxamt,

          num_vchgenmst_payamt AS grossbillamt,
          num_vchgenmst_balamt AS netamt,
          num_vchprepmst_totalamt AS pregrossamt,

          num_vchprepmst_totalamt -
          (
              SELECT SUM(num_vchprepdet_amt)
              FROM aoac_vchprepdet_def
              WHERE num_vchprepdet_refno = vd.num_vchprepdet_refno
          ) AS prenetamt

      FROM aoac_vchprepdet_def vd

      INNER JOIN aoac_vchprepmst_def vm  
          ON vm.num_vchprepmst_refno = vd.num_vchprepdet_refno

      INNER JOIN view_zone vz 
          ON vz.zoneid = vm.num_vchprepmst_zoneid

      INNER JOIN aoac_partymst_def pd  
          ON pd.num_partymst_partyid = vm.num_vchprepmst_partyid

      INNER JOIN aoac_vchtrans_def vt  
          ON vt.num_vchtrans_vchrefno = vm.num_vchprepmst_refno

      INNER JOIN aoac_vchgenmst_def vg
          ON vg.num_vchgenmst_trnsno = vt.num_vchtrans_vchtransno 
          AND vg.num_vchgenmst_refno = vm.num_vchprepmst_refno

      INNER JOIN accountview_web aws  
          ON aws.accno = vt.num_vchtrans_accno  
          AND aws.glcode = vt.num_vchtrans_glcode 
          AND vt.num_vchtrans_ulbid = aws.ulbid

      INNER JOIN aoac_vchtransbal_def vb 
          ON vb.num_vchtransbal_vchtransbalno = vt.num_vchtrans_vchtransno 
          AND vb.num_vchtransbal_vchrefno = vm.num_vchprepmst_refno

      INNER JOIN accountview_web awp  
          ON awp.accno = vd.num_vchprepdet_accno  
          AND awp.glcode = vd.num_vchprepdet_glcode 
          AND vt.num_vchtrans_ulbid = awp.ulbid

      WHERE ${whereClause}

      GROUP BY 
          zoneid,
          zoneename,
          num_vchprepmst_partyid,
          var_partymst_partyname,
          date_vchtrans_trnsdate,
          aws.accno,
          aws.accname,
          vt.num_vchtrans_accno,
          vt.num_vchtrans_glcode,
          num_vchtrans_vchtransno,
          num_vchtransbal_transno,
          vg.num_vchgenmst_netamt,
          vd.num_vchprepdet_refno,
          num_vchgenmst_balamt,
          num_vchgenmst_payamt,
          num_vchgenmst_tdsamt,
          num_vchprepmst_totalamt

      ORDER BY date_vchtrans_trnsdate
    `;

        return await executeQuery(query, bind);

    } catch (err) {
        throw err;
    }
};

const getGovtTaxRegisterSummary = async (params) => {
    try {
        // -------- WHERE (INNER QUERY) via conditions array --------
        const conditions = [
            `TRUNC(date_vchtrans_trnsdate) BETWEEN TO_DATE(:fromDate,'YYYY-MM-DD') AND TO_DATE(:toDate,'YYYY-MM-DD')`,
            `vm.num_vchpremst_ulbid = :ulbId`
        ];

        const bind = {
            fromDate: params.fromDate,
            toDate: params.toDate,
            ulbId: params.ulbId
        };

        // optional filters
        if (params.zoneId && params.zoneId !== "-1" && params.zoneId !=="") {
            conditions.push(`vz.zoneid = :zoneId`);
            bind.zoneId = params.zoneId;
        }

        if (params.partyId && params.partyId !== "-1" && params.partyId !=="") {
            conditions.push(`vm.num_vchprepmst_partyid = :partyId`);
            bind.partyId = params.partyId;
        }

        if (params.majorCode && params.majorCode !=="") {
            conditions.push(`vd.num_vchprepdet_glcode = :majorCode`);
            bind.majorCode = params.majorCode;
        }

        if (params.minorCode && params.minorCode !=="") {
            conditions.push(`vd.num_vchprepdet_accno = :minorCode`);
            bind.minorCode = params.minorCode;
        }

        if (params.bankGl && params.bankGl !=="") {
            conditions.push(`vt.num_vchtrans_glcode = :bankGl`);
            bind.bankGl = params.bankGl;
        }

        if (params.bankAcc && params.bankAcc !=="") {
            conditions.push(`vt.num_vchtrans_accno = :bankAcc`);
            bind.bankAcc = params.bankAcc;
        }

        const whereClause = conditions.join(" AND ");

        // -------- FULL QUERY --------
        const query = `
      SELECT 
          zoneid,
          zoneename,
          tdsgl,
          tdsac,
          tdsname,
          num_vchprepmst_partyid,
          partyname,
          transdt,
          bankname,
          bankac,
          bankgl,
          SUM(taxamt) AS taxamt
      FROM 
      (
          SELECT 
              vz.zoneid,
              vz.zoneename,
              vd.num_vchprepdet_glcode AS tdsgl,
              vd.num_vchprepdet_accno AS tdsac,
              awp.objectcode || '-' || awp.accname AS tdsname,
              vm.num_vchprepmst_partyid,
              pd.var_partymst_partyname AS partyname,
              vt.date_vchtrans_trnsdate AS transdt,
              aws.accno || '-' || aws.accname AS bankname,
              vt.num_vchtrans_accno AS bankac,
              vt.num_vchtrans_glcode AS bankgl,
              vd.num_vchprepdet_amt AS taxamt
          FROM aoac_vchprepdet_def vd

          INNER JOIN aoac_vchtransbaldet_def vbd 
              ON vbd.num_vchtransbaldet_vchrefno = vd.num_vchprepdet_refno
              AND vd.num_vchprepdet_glcode = vbd.num_vchtransbaldet_glcode
              AND vd.num_vchprepdet_accno = vbd.num_vchtransbaldet_accno
              AND vbd.num_vchtransbaldet_amount > 0

          INNER JOIN aoac_vchprepmst_def vm  
              ON vm.num_vchprepmst_refno = vd.num_vchprepdet_refno

          INNER JOIN view_zone vz 
              ON vz.zoneid = vm.num_vchprepmst_zoneid

          INNER JOIN aoac_partymst_def pd  
              ON pd.num_partymst_partyid = vm.num_vchprepmst_partyid

          INNER JOIN aoac_vchtrans_def vt  
              ON vt.num_vchtrans_vchrefno = vm.num_vchprepmst_refno  
              AND vt.num_vchtrans_vchtransno = vbd.num_vchtransbaldet_transno

          INNER JOIN accountview_web aws  
              ON aws.accno = vt.num_vchtrans_accno  
              AND aws.glcode = vt.num_vchtrans_glcode 
              AND vt.num_vchtrans_ulbid = aws.ulbid

          INNER JOIN aoac_vchtransbal_def vb 
              ON vb.num_vchtransbal_vchtransbalno = vt.num_vchtrans_vchtransno 
              AND vb.num_vchtransbal_vchrefno = vm.num_vchprepmst_refno

          INNER JOIN accountview_web awp  
              ON awp.accno = vd.num_vchprepdet_accno  
              AND awp.glcode = vd.num_vchprepdet_glcode 
              AND vt.num_vchtrans_ulbid = awp.ulbid

          WHERE ${whereClause}

          GROUP BY 
              vz.zoneid,
              vz.zoneename,
              vd.num_vchprepdet_glcode,
              vd.num_vchprepdet_accno,
              awp.objectcode,
              awp.accname,
              vm.num_vchprepmst_partyid,
              pd.var_partymst_partyname,
              vt.date_vchtrans_trnsdate,
              aws.accno,
              aws.accname,
              vt.num_vchtrans_accno,
              vt.num_vchtrans_glcode,
              vd.num_vchprepdet_amt
      )
      GROUP BY 
          zoneid,
          zoneename,
          tdsgl,
          tdsac,
          tdsname,
          num_vchprepmst_partyid,
          partyname,
          transdt,
          bankname,
          bankac,
          bankgl
      ORDER BY TRUNC(transdt)
    `;

        return await executeQuery(query, bind);
    } catch (err) {
        throw err;
    }
};

const getGovtTaxSummary2 = async (params) => {
    try {
        const bind = {
            fromDate: params.fromDate,
            toDate: params.toDate,
            ulbId: params.ulbId
        };

        const isZone = params.zoneId && params.zoneId !== "-1" && params.zoneId !== "";

        let query = "";

        if (isZone) {


            // 🔹 ZONE QUERY (2.1)
            query = `
SELECT 
    zoneid,
    zoneename,
    num_vchprepdet_glcode AS tdsgl,
    num_vchprepdet_accno AS tdsac,
    awp.objectcode || '-' || awp.accname AS tdsname,
    SUM(num_vchprepdet_amt) AS taxamt

FROM aoac_vchprepdet_def vd

INNER JOIN aoac_vchprepmst_def vm 
    ON vm.num_vchprepmst_refno = vd.num_vchprepdet_refno

INNER JOIN aoac_vchtransbaldet_def vbd 
    ON vbd.num_vchtransbaldet_vchrefno = vd.num_vchprepdet_refno 
    AND vd.num_vchprepdet_glcode = vbd.num_vchtransbaldet_glcode
    AND vd.num_vchprepdet_accno = vbd.num_vchtransbaldet_accno 
    AND vbd.num_vchtransbaldet_amount > 0

INNER JOIN view_zone vz 
    ON vz.zoneid = vm.num_vchprepmst_zoneid

INNER JOIN accountview_web awp 
    ON awp.accno = vd.num_vchprepdet_accno 
    AND awp.glcode = vd.num_vchprepdet_glcode  
    AND vm.num_vchpremst_ulbid = awp.ulbid

WHERE vd.num_vchprepdet_refno IN  
(
    SELECT vt.num_vchtrans_vchrefno
    FROM aoac_vchtrans_def vt
    INNER JOIN aoac_vchtransbaldet_def vbd2
        ON vt.num_vchtrans_vchtransno = vbd2.num_vchtransbaldet_transno

    WHERE TRUNC(vt.date_vchtrans_trnsdate) 
          BETWEEN TO_DATE(:fromDate,'YYYY-MM-DD') 
          AND TO_DATE(:toDate,'YYYY-MM-DD')

    AND vt.num_vchtrans_ulbid = :ulbId

    GROUP BY vt.num_vchtrans_vchrefno
)

GROUP BY 
    zoneid,
    zoneename,
    num_vchprepdet_glcode,
    num_vchprepdet_accno,
    awp.objectcode,
    awp.accname

ORDER BY 
    zoneid,
    zoneename,
    awp.objectcode,
    awp.accname
`;
        } else {
            // 🔹 ALL ZONE QUERY (2.2)
            query = `
      SELECT  
          vd.num_vchprepdet_glcode AS tdsgl,
          vd.num_vchprepdet_accno AS tdsac,
          awp.objectcode || '-' || awp.accname AS tdsname,
          SUM(vd.num_vchprepdet_amt) AS taxamt

      FROM aoac_vchprepdet_def vd

      INNER JOIN aoac_vchprepmst_def vm 
          ON vm.num_vchprepmst_refno = vd.num_vchprepdet_refno

      INNER JOIN aoac_vchtransbaldet_def vbd 
          ON vbd.num_vchtransbaldet_vchrefno = vd.num_vchprepdet_refno 
          AND vd.num_vchprepdet_glcode = vbd.num_vchtransbaldet_glcode
          AND vd.num_vchprepdet_accno = vbd.num_vchtransbaldet_accno 
          AND vbd.num_vchtransbaldet_amount > 0

      INNER JOIN view_zone vz 
          ON vz.zoneid = vm.num_vchprepmst_zoneid

      INNER JOIN accountview_web awp 
          ON awp.accno = vd.num_vchprepdet_accno 
          AND awp.glcode = vd.num_vchprepdet_glcode  
          AND vm.num_vchpremst_ulbid = awp.ulbid

      WHERE vd.num_vchprepdet_refno IN  
      (
          SELECT vt.num_vchtrans_vchrefno
          FROM aoac_vchtrans_def vt
          INNER JOIN aoac_vchtransbaldet_def vbd2
              ON vt.num_vchtrans_vchtransno = vbd2.num_vchtransbaldet_transno
          WHERE TRUNC(vt.date_vchtrans_trnsdate) 
                BETWEEN TO_DATE(:fromDate,'YYYY-MM-DD') AND TO_DATE(:toDate,'YYYY-MM-DD')
          AND vt.num_vchtrans_ulbid = :ulbId
          GROUP BY vt.num_vchtrans_vchrefno
      )

      GROUP BY  
          vd.num_vchprepdet_glcode,
          vd.num_vchprepdet_accno,
          awp.objectcode,
          awp.accname

      ORDER BY 
          awp.objectcode,
          awp.accname
      `;
        }

        return await executeQuery(query, bind);

    } catch (err) {
        throw err;
    }
};

module.exports = {
    getGovtTaxRegister1,
    getGovtTaxRegisterSummary,
    getGovtTaxSummary2,
};