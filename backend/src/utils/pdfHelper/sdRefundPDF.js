const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const formatDate = (date) => {
    if (!date) return "";
    try {
        return new Date(date).toLocaleDateString("en-GB");
    } catch {
        return date;
    }
};

const formatNumber = (num) => {
    return Number(num || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

async function generateSDRefundPDF({
    data = [],
    corporationName = "",
    corporationLogo = "",
    filters = {},
}) {
    try {
        const templatePath = path.resolve(
            __dirname,
            "../../templates/SDRefundReport.html"
        );

        const htmlTemplate = fs.readFileSync(templatePath, "utf8");
        const template = Handlebars.compile(htmlTemplate);

        const now = new Date();

        const rows = data.map((row, index) => ({
            SRNO: index + 1,
            PARTYCODE: row.PARTYCODE || "",
            PARTYNAME: row.PARTYNAME || "",
            RECEIPTNO: row.RECEIPTNO || "",
            TRANSDT: row.TRANSDT || formatDate(row.TRANSDT),
            TRANSAMNT: formatNumber(row.TRANSAMNT),
            DETAILS: row.DETAILS || "",
            STATUS: row.STATUS || "",
        }));

        const html = template({
            logo: corporationLogo,
            corporationName,
            reportDate: formatDate(now),
            rows,
            printDate: formatDate(now),
            printTime: now.toLocaleTimeString("en-IN"),
            userId: filters.userId || "SYSTEM",
        });

        // ================= PUPPETEER =================
        const chromePath = path.resolve(
            __dirname,
            "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
        );

        const launchOptions = {
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        };

        if (fs.existsSync(chromePath)) {
            launchOptions.executablePath = chromePath;
        }

        const browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();


        await page.setContent(html, {
            waitUntil: "networkidle0",
            timeout: 0,
        });

        const pdfBuffer = await page.pdf({
            // format: "A4",
            // landscape: true,
            printBackground: true,
            margin: {
                top: "5mm",
                right: "5mm",
                bottom: "5mm",
                left: "5mm",
            },
        });

        await browser.close();

        const outputDir = path.resolve(__dirname, "../../../public/pdf");
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const fileName = `SDRefund_${Date.now()}.pdf`;
        const filePath = path.join(outputDir, fileName);

        fs.writeFileSync(filePath, pdfBuffer);

        return {
            fileName,
            filePath,
        };
    } catch (error) {
        console.error("SD Refund PDF Error:", error);
        throw error;
    }
}

module.exports = {
    generateSDRefundPDF,
};