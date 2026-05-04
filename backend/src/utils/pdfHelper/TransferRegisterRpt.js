const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "";

const formatNumber = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const TransferRegisterRpt = async ({
  reportData,
  summary,
  filters,
  corporationName,
  logo,
  header,
  subHeader
}) => {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/TransferRegisterRpt.html"
    );

    const htmlFile = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlFile);

    // 🔹 Data Mapping
    const rows = reportData.map((r, index) => ({
      SR: index + 1,
      DATE: formatDate(r.TRNSDATE),
      TRANSNO: r.TRANSNO || "",
      DOCNO: r.DOCNO || "",
      CHQNO: r.CHQNO || "",
      TYPE: r.FLAG === "R" ? "Receipt" : "Payment",
      ACCCODE: r.ACCNOAC || "",
      ACCNAME: r.ACCNAME || "",
      NARRATION: r.NARRATION || "",
      RECEIPT: formatNumber(r.RECEIPTAMT),
      PAYMENT: formatNumber(r.PAYMENTAMT),
      BANKNAME: r.BANKNAME || ""
    }));

    // 🔹 HTML Bind
    const html = template({
      corporationName,
      logo,
      header,
      subHeader,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      rows,
      opening: formatNumber(summary?.OPENING),
      receipt: formatNumber(summary?.RECEIPT),
      payment: formatNumber(summary?.PAYMENT),
      closing: formatNumber(Math.abs(summary?.CLOSING)),
      printDate: new Date().toLocaleString("en-IN")
    });

    // 🔹 Puppeteer
    // const browser = await puppeteer.launch({
    //   headless: true,
    //   args: ["--no-sandbox", "--disable-setuid-sandbox"]
    // });

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
      landscape: true,
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "8mm",
        right: "8mm"
      }
    });

    await browser.close();

    // 🔹 Save File
    const dir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const fileName = `TransferRegister_${Date.now()}.pdf`;
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };

  } catch (err) {
    console.error("PDF Error:", err);
    throw err;
  }
};

module.exports = { TransferRegisterRpt };