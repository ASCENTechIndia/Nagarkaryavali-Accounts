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
  return new Date(date).toLocaleDateString("en-GB");
};

const formatNumber = (num) => {
  return Number(num || 0).toLocaleString("en-IN");
};

const RptReceiptRegisterDetailsPDFHelper = async ({ reportData, filters, ulbInfo }) => {
  try {
    if (!reportData.length) throw new Error("No data");

    const templatePath = path.resolve(
      __dirname,
      "../../templates/RptReceiptRegisterDetails.html"
    );

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const logoPath = path.resolve(__dirname, "../../assets/logo.png");
    const logo = imageToBase64(logoPath);

    let total = 0;

    let totalAmount = 0;
    let sutRakkam = 0;

    const rows = reportData.map((row) => {
      const amt = Number(row.AMOUNT || 0);

      totalAmount += amt;

      if (String(row.ACCNO) === "91028290003") {
        sutRakkam += amt;
      }

      return {
        TRNSDATE: formatDate(row.TRNSDATE),
        TRANSNO: row.TRANSNO,
        DOCNO: row.DOCNO,
        ACCNO: row.ACCNO,
        ACCNAME: row.ACCNAME,
        NARRATION: row.NARRATION,
        PARTYNAME: row.PARTYNAME || "",
        AMOUNT: formatNumber(amt)
      };
    });

    const netCollectedAmount = totalAmount - sutRakkam;

    const html = template({
      logo: ulbInfo.ULBLOGO,
      corporationName: ulbInfo.ABC_MUNICIPAL_TEXT,
      fromDate: formatDate(filters.fromDate),
      toDate: formatDate(filters.toDate),
      zoneName: filters.zoneName || "All",
      rows,

      totalAmount: formatNumber(totalAmount),
      sutRakkam: formatNumber(sutRakkam),
      netCollectedAmount: formatNumber(netCollectedAmount),

      currentDate: new Date().toLocaleString("en-IN")
    });

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
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 0 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await page.close();
    await browser.close();

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `Receipt_Register_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };

  } catch (error) {
    console.error("PDF Error:", error);
    throw error;
  }
};

module.exports = {
  RptReceiptRegisterDetailsPDFHelper
};