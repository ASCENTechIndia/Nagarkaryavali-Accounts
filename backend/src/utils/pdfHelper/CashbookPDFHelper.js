const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB");

const formatNumber = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const CashbookPDFHelper = async ({ reportData, filters }) => {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/Cashbook.html"
    );

    const htmlFile = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlFile);


   
    const receiptList = reportData.filter(r => r.TRANSTYPE === "R");
const paymentList = reportData.filter(r => r.TRANSTYPE === "P");

const maxLength = Math.max(receiptList.length, paymentList.length);

const rows = [];
let totalReceipt = receiptList.reduce((sum, r) =>
  sum + (r.CASHAMOUNT || 0) + (r.BANKAMOUNT || 0), 0);

let totalPayment = paymentList.reduce((sum, p) =>
  sum + (p.BANKAMOUNT || 0) + (p.TRANSAMOUNT || 0), 0);
for (let i = 0; i < maxLength; i++) {
  const r = receiptList[i] || {};
  const p = paymentList[i] || {};

  rows.push({
    SR: i + 1,

    // RECEIPT SIDE
    R_ZONE: r.ZONEENAME || "",
    R_DOCNO: r.DOCNO || "",
    R_CODE: r.OBJECTCODE || "",
    R_NAME: r.ACCNAME || "",
    R_NARRATION: r.NARRATION || "",
    R_CASH: r.CASHAMOUNT || 0,
    R_BANK: r.BANKAMOUNT || 0,
    R_TOTAL: (r.CASHAMOUNT || 0) + (r.BANKAMOUNT || 0),

    // PAYMENT SIDE
    P_DOCNO: p.DOCNO || "",
    P_CODE: p.OBJECTCODE || "",
    P_PARTY: p.PARTYNAME || "",
    P_NARRATION: p.NARRATION || "",
    P_CHQNO: p.CHQNO || "",
    P_AMOUNT: p.BANKAMOUNT || 0,
    P_TRANSFER: p.TRANSAMOUNT || 0,
    P_TOTAL: (p.BANKAMOUNT || 0) + (p.TRANSAMOUNT || 0)
  });
}

    const html = template({
      corporationName: "अहमदनगर महानगरपालिका, अहमदनगर",
      fromDate: filters.date,
      rows,
      totalReceipt: formatNumber(totalReceipt),
      totalPayment: formatNumber(totalPayment),
      closing: formatNumber(totalReceipt - totalPayment)
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });

   const pdfBuffer = await page.pdf({
  format: "A4",
  landscape: true,
  printBackground: true,
  margin: {
    top: "10mm",
    bottom: "10mm",
    left: "5mm",
    right: "5mm"
  }
});
    await browser.close();

    const dir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const fileName = `Cashbook_${Date.now()}.pdf`;
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };

  } catch (err) {
    console.error("PDF Error:", err);
    throw err;
  }
};

module.exports = { CashbookPDFHelper };