const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-GB") : "";
const imageToBase64 = (imgPath) => {
  try {
    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch {
    return "";
  }
};
const formatNumber = (num) =>
  Number(num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const ChequeRegisterPDFHelper = async ({ reportData, filters }) => {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/RptChequeRegister.html"
    );

    const logoPath = path.resolve(__dirname, "../../assets/logo.png");
    const logo = imageToBase64(logoPath);
    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    let totalGross = 0;
    let totalDeduction = 0;
    let totalNet = 0;
    let totalCheque = 0;

    const rows = reportData.map((r) => {
      totalGross += Number(r.GROSSAMT || 0);
      totalDeduction += Number(r.TDS || 0);
      totalNet += Number(r.NETAMOUNT || 0);
      totalCheque += Number(r.CHEQAMT || 0);

      return {
        ...r,
        CHEQDATE: formatDate(r.CHEQDATE),
        VCHODATE: formatDate(r.VCHODATE),
        SYSTEMBILLDATE: formatDate(r.SYSTEMBILLDATE),
        GROSSAMT: formatNumber(r.GROSSAMT),
        TDS: formatNumber(r.TDS),
        NETAMOUNT: formatNumber(r.NETAMOUNT),
        CHEQAMT: formatNumber(r.CHEQAMT),
      };
    });
const now = new Date();
  const html = template({
  logo,
      corporationName: "मालेगाव महानगरपालिका मालेगाव",
  fromDate: formatDate(filters.fromDate),
  toDate: formatDate(filters.toDate),
  currentDate: formatDate(now),
  currentTime: now.toLocaleTimeString(),
  pageInfo: "Page 1 of 1", // later dynamic
  rows,
  totalGross,
  totalDeduction,
  totalNet,
  totalCheque
});

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `Cheque_Register_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };

  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = { ChequeRegisterPDFHelper };