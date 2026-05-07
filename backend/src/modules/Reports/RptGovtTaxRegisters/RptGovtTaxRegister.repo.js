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
            `trunc(date_vchtrans_trnsdate) between TO_DATE(:fromDate,'YYYY-MM-DD') AND TO_DATE(:toDate,'YYYY-MM-DD')`,
            ` num_vchpremst_ulbid = :ulbId`
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
            conditions.push(`num_vchprepmst_partyid = :partyId`);
            bind.partyId = params.partyId;
        }

        if (params.majorCode && params.majorCode !=="") {
            conditions.push(`num_vchprepdet_glcode = :majorCode`);
            bind.majorCode = params.majorCode;
        }

        if (params.minorCode && params.minorCode !=="") {
            conditions.push(`num_vchprepdet_accno = :minorCode`);
            bind.minorCode = params.minorCode;
        }

        if (params.bankGl && params.bankGl !=="") {
            conditions.push(`num_vchtrans_glcode = :bankGl`);
            bind.bankGl = params.bankGl;
        }

        if (params.bankAcc && params.bankAcc !=="") {
            conditions.push(`num_vchtrans_accno = :bankAcc`);
            bind.bankAcc = params.bankAcc;
        }

        const whereClause = conditions.join(" AND ");

        // -------- FULL QUERY --------
        const query = `
            select zoneid,zoneename,tdsgl,tdsac,tdsname,num_vchprepmst_partyid, partyname,transdt, 
            bankname,bankac,bankgl,sum(taxamt) taxamt
        
            from  
            (
                select zoneid, zoneename, num_vchprepdet_glcode TDSgl, num_vchprepdet_accno tdsac, 
                awp.objectcode || '-' || AWp.accname tdsname,num_vchprepmst_partyid,var_partymst_partyname partyname, 
                date_vchtrans_trnsdate Transdt,AWs.accno || '-' || Aws.accname bankname,VT.num_vchtrans_accno bankac, 
                VT.num_vchtrans_glcode bankgl, num_vchprepdet_amt taxamt
                
                from aoac_vchprepdet_def VD

                Inner Join aoac_vchtransbaldet_def on num_vchtransbaldet_vchrefno = vd.num_vchprepdet_refno 
                and num_vchprepdet_glcode = num_vchtransbaldet_glcode
                and num_vchprepdet_accno = num_vchtransbaldet_accno and num_vchtransbaldet_amount> 0

                Inner Join  aoac_vchprepmst_def VM  on VM.num_vchprepmst_refno = VD.num_vchprepdet_refno

                Inner Join view_zone VZ on VZ.zoneid = VM.num_vchprepmst_zoneid

                Inner Join aoac_partymst_def Pd  on Pd.num_partymst_partyid = VM.num_vchprepmst_partyid

                inner Join aoac_vchtrans_def VT  on VT.num_vchtrans_vchrefno = VM.num_vchprepmst_refno  
                and num_vchtrans_vchtransno=num_vchtransbaldet_transno

                Inner Join accountview_web AWs  on AWs.accno = VT.num_vchtrans_accno  and AWs.glcode = VT.num_vchtrans_glcode 
                and VT.num_vchtrans_ulbid = AWs.ulbid

                Inner Join aoac_vchtransbal_def VB on VB.num_vchtransbal_vchtransbalno = VT.num_vchtrans_vchtransno 
                and VB.num_vchtransbal_vchrefno = VM.num_vchprepmst_refno

                Inner Join accountview_web AWp  on AWp.accno = VD.num_vchprepdet_accno  and AWp.glcode = VD.num_vchprepdet_glcode 
                and VT.num_vchtrans_ulbid = AWp.ulbid

                WHERE ${whereClause}

                group by zoneid, zoneename, num_vchprepdet_glcode , num_vchprepdet_accno , AWp.accno , AWp.accname ,
                num_vchprepmst_partyid,var_partymst_partyname , date_vchtrans_trnsdate ,
                AWs.accno , Aws.accname ,VT.num_vchtrans_accno , VT.num_vchtrans_glcode , num_vchprepdet_amt  ,awp.objectcode
                order by date_vchtrans_trnsdate
            )
      
            group by zoneid,zoneename,tdsgl,tdsac,  tdsname,num_vchprepmst_partyid,  partyname,transdt, bankname,  bankac,bankgl 
            order by trunc(transdt)
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
            query = `
            select zoneid, zoneename, num_vchprepdet_glcode tdsgl, num_vchprepdet_accno tdsac, awp.objectcode || '-' || awp.accname tdsname,
            SUM(num_vchprepdet_amt) taxamt 
            
            from aoac_vchprepdet_def vd

            INNER JOIN aoac_vchprepmst_def vm ON vm.num_vchprepmst_refno = vd.num_vchprepdet_refno

            Inner Join aoac_vchtransbaldet_def on num_vchtransbaldet_vchrefno = vd.num_vchprepdet_refno 
            and num_vchprepdet_glcode = num_vchtransbaldet_glcode
            and num_vchprepdet_accno = num_vchtransbaldet_accno and num_vchtransbaldet_amount> 0

            INNER JOIN view_zone vz ON vz.zoneid = vm.num_vchprepmst_zoneid

            INNER JOIN accountview_web awp ON awp.accno = vd.num_vchprepdet_accno 
            AND awp.glcode = vd.num_vchprepdet_glcode  AND vm.num_vchpremst_ulbid = awp.ulbid

            where num_vchprepmst_refno in
            (
                select num_vchtrans_vchrefno from aoac_vchtrans_def where trunc(date_vchtrans_trnsdate) between TO_DATE(:fromDate,'YYYY-MM-DD') 
                AND TO_DATE(:toDate,'YYYY-MM-DD')
                and num_vchtrans_ulbid = :ulbId and num_vchtrans_vchtransno=num_vchtransbaldet_transno
                group by  num_vchtrans_vchrefno 
            )

            GROUP BY zoneid, zoneename, num_vchprepdet_glcode, num_vchprepdet_accno,awp.objectcode, awp.accname
            order by zoneid,zoneename,awp.objectcode, awp.accname
             `;
        } 
        else 
        {        
            query = `
            select  num_vchprepdet_glcode tdsgl, num_vchprepdet_accno tdsac, awp.objectcode || '-' || awp.accname tdsname,
            SUM(num_vchprepdet_amt) taxamt        
            from aoac_vchprepdet_def vd
            INNER JOIN aoac_vchprepmst_def vm ON vm.num_vchprepmst_refno = vd.num_vchprepdet_refno
            Inner Join aoac_vchtransbaldet_def on num_vchtransbaldet_vchrefno = vd.num_vchprepdet_refno 
            and num_vchprepdet_glcode = num_vchtransbaldet_glcode
            and num_vchprepdet_accno = num_vchtransbaldet_accno and num_vchtransbaldet_amount> 0
            INNER JOIN view_zone vz ON vz.zoneid = vm.num_vchprepmst_zoneid
            INNER JOIN accountview_web awp ON awp.accno = vd.num_vchprepdet_accno 
            AND awp.glcode = vd.num_vchprepdet_glcode  AND vm.num_vchpremst_ulbid = awp.ulbid
            where num_vchprepmst_refno in
            (
                select num_vchtrans_vchrefno from aoac_vchtrans_def where trunc(date_vchtrans_trnsdate) between
                TO_DATE(:fromDate,'YYYY-MM-DD') AND TO_DATE(:toDate,'YYYY-MM-DD')
                and num_vchtrans_ulbid = :ulbId and num_vchtrans_vchtransno=num_vchtransbaldet_transno
                group by  num_vchtrans_vchrefno
            )
            GROUP BY  num_vchprepdet_glcode, num_vchprepdet_accno,awp.objectcode, awp.accname
            order by awp.objectcode, awp.accname
            `;
        }
        console.log("query",query)
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