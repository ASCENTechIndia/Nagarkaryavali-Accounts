
const { executeQuery } = require("../../../db/queryExecutor");

const getReceiptSearch = async (params) => {
    try {
        let query = `
            SELECT 
                num_receiptmst_recno AS receiptno,
                transno AS transno,
                var_partymst_partyname AS partyname,
                trnsdate AS trnsdate,
                a.glcode,
                acc.glname,
                a.accno,
                acc.accname,
                zoneename AS zoneename,
                a.amount AS amount,
                narration,
                acc.functioncode,
                acc.objectcode
            FROM transview a
            INNER JOIN accountview_web acc 
                ON a.glcode = acc.glcode  
                AND a.accno = acc.accno
            LEFT JOIN view_zone vz 
                ON vz.zoneid = a.zoneid
            INNER JOIN aoac_receiptmst_def 
                ON num_receiptmst_trnsno = a.transno 
                AND a.zoneid = num_receiptmst_zoneid
            LEFT OUTER JOIN aoac_partymst_def 
                ON num_partymst_partyid = a.partycode
            WHERE 
TRUNC(a.trnsdate) BETWEEN 
    TO_DATE(:FromDate, 'YYYY-MM-DD') 
    AND TO_DATE(:ToDate, 'YYYY-MM-DD')
                AND a.amount > 0
                AND (
                    a.trnstypeid IN (1, 2) 
                    OR (
                        a.sourceid = 6 
                        AND a.amount > 0 
                        AND acc.accsubtypeid NOT IN (4810, 4820, 4821, 4822, 4823)
                    )
                )
        `;

        let bindParams = {
            FromDate: params.fromDate,
            ToDate: params.toDate
        };

        // Optional filters
        if (params.zoneId) {
            query += ` AND a.zoneid = :ZoneId`;
            bindParams.ZoneId = params.zoneId;
        }

        if (params.transNo) {
            query += ` AND transno = :TransNo`;
            bindParams.TransNo = params.transNo;
        }

        if (params.receiptNo) {
            query += ` AND num_receiptmst_recno = :ReceiptNo`;
            bindParams.ReceiptNo = params.receiptNo;
        }

        if (params.partyId) {
            query += ` AND partycode = :PartyId`;
            bindParams.PartyId = params.partyId;
        }

        if (params.fromAmount) {
            query += ` AND amount >= :FromAmount`;
            bindParams.FromAmount = params.fromAmount;
        }

        if (params.toAmount) {
            query += ` AND amount <= :ToAmount`;
            bindParams.ToAmount = params.toAmount;
        }

        query += ` ORDER BY a.glcode, a.accno`;

        return await executeQuery(query, bindParams);

    } catch (error) {
        throw error;
    }
};

module.exports = {
    getReceiptSearch
};