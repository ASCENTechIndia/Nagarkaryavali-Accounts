const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

// ================= DATE FORMAT =================
const formatDate = (date) => {
  if (!date) return "";

  const [day, month, year] = date.split("-");
  return `${day}-${month}-${year}`;
};

// ================= NUMBER FORMAT =================
const formatNumber = (num) => {
  return Number(num || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// ================= IMAGE BASE64 =================
const imageToBase64 = (imgPath) => {
  try {
    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch {
    return "";
  }
};

// ================= MAIN HELPER =================
const TrialBalancePDFHelper = async ({ reportData, filters }) => {
  try {
    if (!reportData || !reportData.length) {
      throw new Error("No data for PDF");
    }

    let { fromDate, toDate } = filters;

    fromDate = formatDate(fromDate);
    toDate = formatDate(toDate);

    // ================= GROUP BY GL =================
    const grouped = {};

    reportData.forEach((row) => {
      const key = row.GLCODE;

      if (!grouped[key]) {
        grouped[key] = {
          srNo: Object.keys(grouped).length + 1,
          glcode: row.FUNCTIONCODE,
          glname: row.GLNAME,
          items: [],
          totalOpening: 0,
          totalCredit: 0,
          totalDebit: 0,
          totalClosing: 0,
        };
      }

      const opening = Number(row.OPENINGBAL || 0);
      const credit = Number(row.CREDIT || 0);
      const debit = Number(row.DEBIT || 0);
      const closing = Number(row.CLOSINGBAL || 0);

      grouped[key].items.push({
        accno: row.OBJECTCODE,
        accname: row.ACCNAME,

        opening: formatNumber(opening),
        credit: formatNumber(credit),
        debit: formatNumber(debit),
        closing: formatNumber(closing),

        openingcrdr: row.OPENINGCRDR,
        closingcrdr: row.CLOSINGCRDR,
      });

      grouped[key].totalOpening += opening;
      grouped[key].totalCredit += credit;
      grouped[key].totalDebit += debit;
      grouped[key].totalClosing += closing;
    });

    const groups = Object.values(grouped);

    // ================= GRAND TOTAL =================
    let grandOpening = 0;
    let grandCredit = 0;
    let grandDebit = 0;
    let grandClosing = 0;
    reportData.forEach((r) => {
      grandOpening += Number(r.OPENINGBAL || 0);
      grandCredit += Number(r.CREDIT || 0);
      grandDebit += Number(r.DEBIT || 0);
      grandClosing += Number(r.CLOSINGBAL || 0);
    });

    // ================= TEMPLATE =================

    const currentDate = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const templatePath = path.resolve(__dirname, "../../templates/TrialBalance.html");

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    // ================= LOGO =================
    const logoPath = path.resolve(__dirname, "../../assets/logo.png");
    const logo = imageToBase64(logoPath);

    const html = template({
      logo,
      corporationName: "अहिल्यानगर महानगरपालिका, अहिल्यानगर",
      title: "ट्रायल बॅलन्स",
      fromDate,
      toDate,
      groups,
      grandOpening: formatNumber(grandOpening),
      grandCredit: formatNumber(grandCredit),
      grandDebit: formatNumber(grandDebit),
      grandClosing: formatNumber(grandClosing),
      generatedAt: new Date().toLocaleString("en-IN"),
      currentDate,
    });

    // ================= PUPPETEER =================
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,

      displayHeaderFooter: true,

      headerTemplate: `<div></div>`,

      footerTemplate: `
    <div style="width:100%; font-size:10px; padding:0 20px;">
      <div style="
    border-top:2px solid #000;
    margin-bottom:5px;
  "></div>
      <div style="display:flex; justify-content:space-between;">
        <div>दिनांक : ${currentDate}</div>
        <div>युजर आयडी :</div>
        <div>
          पान :
          <span class="pageNumber"></span> /
          <span class="totalPages"></span>
        </div>
      </div>
    </div>
  `,

      margin: {
        top: "0px" /* 🔥 Change this to 0 */,
        bottom: "60px",
        left: "20px",
        right: "20px",
      },
    });

    await browser.close();

    // ================= SAVE FILE =================
    const outputDir = path.resolve(__dirname, "../../../public/pdf");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `Trial_Balance_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return {
      fileName,
      filePath,
    };
  } catch (error) {
    console.error("Trial Balance PDF Error:", error);
    throw error;
  }
};

module.exports = {
  TrialBalancePDFHelper,
};
