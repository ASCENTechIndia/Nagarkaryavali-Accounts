const { executeQuery } = require("../../../db/queryExecutor");
const oracledb = require("oracledb");
const { withTx } = require("../../../db/tx");


const getUserList = async (ulbId) => {
    try {
        const query = `
      SELECT  
        var_user_username AS UserName,
        num_user_userid AS UserId
      FROM admins.aoma_user_def
      WHERE num_user_ulbid = :UlbId
    `;

        const bindParams = {
            UlbId: ulbId,
        };

        return await executeQuery(query, bindParams);
    } catch (err) {
        throw err;
    }
};

const getReceiptRegisterEntryStatus = async (params) => {
    try {
        if (!params.fromDate || !params.toDate) {
            throw new Error("From Date and To Date are required.");
        }

        let query = `
            SELECT
                TRNSDATE,
                PRABHAGNAME,
                PRABHAGID,
                VIBHAGID,
                VIBHAGNAME,
                USERID,
                RECNO,
                TRANSNO,
                CNT,
                AMOUNT
            FROM vw_transentstatus
            WHERE TRNSDATE BETWEEN TO_DATE(:FROMDATE, 'DD-MM-YYYY')
                              AND TO_DATE(:TODATE, 'DD-MM-YYYY')
        `;

        const bindParams = {
            FROMDATE: params.fromDate,
            TODATE: params.toDate,
        };

        if (
            params.zoneId &&
            params.zoneId !== "-1" &&
            params.zoneId !== ""
        ) {
            query += ` AND PRABHAGID = :ZONEID`;
            bindParams.ZONEID = Number(params.zoneId);
        }

        if (
            params.department &&
            params.department !== "-1" &&
            params.department !== ""
        ) {
            query += ` AND VIBHAGID = :DEPARTMENTID`;
            bindParams.DEPARTMENTID = Number(params.department);
        }

        if (
            params.userId &&
            params.userId !== "-1" &&
            params.userId !== "0" &&
            params.userId !== ""
        ) {
            query += ` AND UPPER(USERID) = UPPER(:USERID)`;
            bindParams.USERID = params.userId;
        }

        query += `
            ORDER BY
                TRNSDATE,
                PRABHAGNAME,
                VIBHAGNAME,
                USERID,
                RECNO
        `;

        return await executeQuery(query, bindParams);
    } catch (err) {
        console.error("Error in getReceiptRegisterEntryStatus:", err);
        throw err;
    }
};

module.exports = {
    getUserList,
    getReceiptRegisterEntryStatus
};
