const repo = require("./FrmGovtTaxPayment.repo");

const getGovtTaxPaymentService = async (body) => {
    try {
        const data = await repo.getGovtTaxPayment(body);

        if (!data || data.length === 0) {
            return {
                success: false,
                message: "No Data Found",
                data: []
            };
        }

        return {
            success: true,
            message: "Data fetched successfully",
            data
        };

    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};

const govtTaxInsertService = async (payload) => {
  const { userId, refNo, trnsSourceId, trnsStatus, str1, str2 } = payload;

  if (!userId) {
    throw new AppError("userId is required", 400);
  }

  const result = await repo.govtTaxInsert(
    userId,
    refNo,
    trnsSourceId,
    trnsStatus,
    str1,
    str2
  );

  return {
    success: result.errorCode === 0,   // ✔ same logic as your SP
    ...result
  };
};

module.exports = {
    getGovtTaxPaymentService, govtTaxInsertService
};