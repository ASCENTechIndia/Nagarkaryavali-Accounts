const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const imageToBase64 = (imgPath) => {
    try {
        const file = fs.readFileSync(imgPath);
        const ext = path.extname(imgPath).replace(".", "");
        return `data:image/${ext};base64,${file.toString("base64")}`;
    } catch {
        return "";
    }
};

const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-GB");
};

const formatNumber = (num) =>
    Number(num || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const TransactionEntryStatusPDFHelper = async ({
    reportData,
    filters,
    corporationName,
    corporationLogo,
}) => {
    try {
        if (!reportData.length) throw new Error("No data found.");

        const templatePath = path.resolve(
            __dirname,
            "../../templates/FrmTransactionEntryStatusRpt.html"
        );

        const templateHtml = fs.readFileSync(templatePath, "utf8");

        const template = Handlebars.compile(templateHtml);

        const logo = corporationLogo

        let totalCount = 0;
        let totalAmount = 0;

        const rows = reportData.map((item, index) => {
            totalCount += Number(item.CNT || 0);
            totalAmount += Number(item.AMOUNT || 0);

            return {
                srNo: index + 1,
                trnsDate: formatDate(item.TRNSDATE),
                zone: item.PRABHAGNAME,
                department: item.VIBHAGNAME,
                user: item.USERID,
                receiptNo: item.RECNO,
                transNo: item.TRANSNO,
                count: item.CNT,
                amount: formatNumber(item.AMOUNT),
            };
        });

        const html = template({
            corporationLogo: logo,
            corporationName: corporationName,
            rows: rows,
            fromDate: filters.fromDate || "",
            toDate: filters.toDate || "",
            zone: filters.zone || "ALL",
            department: filters.department || "ALL",
            user: filters.userId || "ALL",
            totalCount: totalCount,
            totalAmount: formatNumber(totalAmount), 
        });


        // const browser = await puppeteer.launch({
        //   headless: true,
        //   args: ["--no-sandbox"],
        // });

        // const page = await browser.newPage();

        // await page.setContent(html, {
        //   waitUntil: "networkidle0",
        // });

        // const pdfBuffer = await page.pdf({
        //   format: "A4",
        //   landscape: true,
        //   printBackground: true,
        // });

        // await browser.close();

        const chromePath = path.resolve(
            __dirname,
            "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
        );
        const launchOptions = { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] };
        if (fs.existsSync(chromePath)) launchOptions.executablePath = chromePath;

        const browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 0 });

        const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
        await page.close();
        await browser.close();

        const outputDir = path.resolve(
            __dirname,
            "../../../public/pdf"
        );

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const fileName = `Transaction_Entry_Status_${Date.now()}.pdf`;

        const filePath = path.join(outputDir, fileName);

        fs.writeFileSync(filePath, pdfBuffer);

        return {
            fileName,
            filePath,
        };
    } catch (err) {
        console.log(err);
        throw err;
    }
};

module.exports = {
    TransactionEntryStatusPDFHelper,
};