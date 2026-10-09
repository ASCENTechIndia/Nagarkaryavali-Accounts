// utils/pdfHelper/CounterVoucherPDFHelper.js

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

// =======================
// HELPERS
// =======================
const formatDate = (date) => {
  if (!date) return "-";
  if (typeof date === "string" && date.includes("/")) return date;
  return new Date(date).toLocaleDateString("en-GB");
};

const formatNumber = (num) =>
  Number(num || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });


  const formatAccountCode = (value) => {
      if (!value) return value;

      const [code, ...rest] = value.split("/");

      const paddedCode = code.padStart(11, "0");

      return rest.length > 0
          ? `${paddedCode}/${rest.join("/")}`
          : paddedCode;
  };

// =======================
// MAIN FUNCTION
// =======================
const CounterVoucherPDFHelper = async ({
  details = [],
  corporationName = "",
  corporationLogo = "",
  transNo,
  refNo
}) => {
  let browser, page;

  try {
    const safeDetails = details || [];

    // =======================
    // MAP DATA (MATCH TEMPLATE)
    // =======================
    const rows = safeDetails.map((d) => ({
      drCode: formatAccountCode(d.DRACCOUNTCODE) || "-",
      drParticular: d.DRPARTICULARS || "-",
      drAmount: formatNumber(d.DRAMOUNT),

      crCode: formatAccountCode(d.CRACCOUNTCODE) || "-",
      crParticular: d.CRPARTICULARS || "-",
      crAmount: formatNumber(d.CRAMOUNT),
    }));

    const firstRow = safeDetails[0] || {};

    console.log("firstRow: ", firstRow);
    const now = new Date();

    // =======================
    // DATA FOR TEMPLATE
    // =======================
    const data = {
      corporationName,
      corporationLogo,

      currentDate: formatDate(firstRow.VOUCHERDATE),
      currentTime: now.toLocaleTimeString(),

      voucherNo: firstRow.VOUCHERNO || "-",
      chequeNo: firstRow.CHQNO || "-",

      rows,
      transNo: transNo,
      refNo: refNo
    };

    // =======================
    // TEMPLATE
    // =======================
    const templatePath = path.resolve(
      __dirname,
      "../../templates/CounterVoucher.html"
    );

    const html = Handlebars.compile(
      fs.readFileSync(templatePath, "utf8")
    )(data);

    // =======================
    // PUPPETEER
    // =======================
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
       
       page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });

    // =======================
    // SAVE
    // =======================
    const outputDir = path.resolve(__dirname, "../../../public/pdf");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `CounterVoucher_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };

  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
};

module.exports = { CounterVoucherPDFHelper };