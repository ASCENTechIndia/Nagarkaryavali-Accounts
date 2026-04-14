const repo = require("./FrmSearchOption.repo");

const getReceiptSearchService = async (body) => {
    try {
        const data = await repo.getReceiptSearch(body);

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
        throw error;
    }
};

module.exports = {
    getReceiptSearchService
};