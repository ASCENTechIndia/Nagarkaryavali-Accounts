const service = require("./FrmSearchOption.service");
const asyncHandler = require("../../../libs/asyncHandler");

const getReceiptSearch = asyncHandler(async (req, res) => {
    const response = await service.getReceiptSearchService(req.body);
    res.json(response);
});

module.exports = {
    getReceiptSearch
};