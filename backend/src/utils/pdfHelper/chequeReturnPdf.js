const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");

/* ================= DATE FORMAT ================= */
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/* ================= IMAGE BASE64 ================= */
const imageToBase64 = (imgPath) => {
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

/* ================= MAIN PDF ================= */
const generateChequeReturnPDF = async ({ fromDate, toDate, rows }) => {
  try {

    /* ===== FORMAT HEADER DATE ===== */
    fromDate = formatDate(fromDate);
    toDate = formatDate(toDate);

    /* ===== GROUP BY BANK + CHEQUE ===== */
    const grouped = {};

    rows.forEach(r => {
      const key = r.bankname + "_" + r.chequeno;

      if (!grouped[key]) {
        grouped[key] = {
          bankName: r.bankname,
          chequeNo: r.chequeno,
          chequeDate: formatDate(r.chequedt),
          rows: [],
          total: 0
        };
      }

      grouped[key].rows.push({
        recno: r.recno,
        receiptdt: formatDate(r.receiptdt),
        zone: r.prabhag_id,
        ward: r.ward_name,
        propno: r.propno,
        owner: r.owner_name,
        mobile: r.mobile,
        amount: Number(r.amount).toFixed(2),
        insdate: formatDate(r.insdate),
        remark: r.remark
      });

      grouped[key].total += Number(r.amount);
    });

    const banks = Object.values(grouped).map(b => ({
      ...b,
      total: b.total.toFixed(2)
    }));

    /* ===== LOAD TEMPLATE ===== */
    const templatePath = path.resolve(__dirname,"../../templates/cheque-return-report.html");
    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    /* ===== LOGO ===== */
    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    const html = template({ logo, fromDate, toDate, banks });

    /* ===== PUPPETEER ===== */
   const browser = await puppeteer.launch({
  headless: "new",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu"
  ],
  ignoreDefaultArgs: ["--disable-extensions"],
  userDataDir: false   // 🔥 VERY IMPORTANT FIX
});


    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 0 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "8mm", right: "8mm" }
    });

    await browser.close();

    /* ===== SAVE PDF ===== */
    const finalPdf = await PDFDocument.create();
    const tempPdf = await PDFDocument.load(pdfBuffer);
    const pages = await finalPdf.copyPages(tempPdf, tempPdf.getPageIndices());
    pages.forEach(p => finalPdf.addPage(p));

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const fileName = `ChequeReturn_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    fs.writeFileSync(outputPath, await finalPdf.save());

    /* ===== RETURN URL ===== */
    const baseUrl = process.env.BASE_URL ;
    const fileUrl = `${baseUrl}/pdf/${fileName}`;

    return {
      fileName,
      outputPath,
      fileUrl
    };

  } catch (err) {
    console.error("PDF ERROR:", err);
    throw err;
  }
};

module.exports = { generateChequeReturnPDF };
