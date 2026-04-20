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

const RptReceiptRegisterPDFHelper = async ({ reportData, filters, corporationName, corporationLogo }) => {
  try {
    if (!reportData.length) throw new Error("No data");

    const templatePath = path.resolve(
      __dirname,
      "../../templates/RptReceiptRegister.html"
    );

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    // 🔥 Use logo from DB if provided, else fallback to local asset
    let logo = corporationLogo;
      // ? `data:image/png;base64,${corporationLogo}`
      // : imageToBase64(path.resolve(__dirname, "../../assets/logo.png"));

    let total = 0;
    const rows = reportData.map((row) => {
      const amt = Number(row.AMOUNT || 0);
      total += amt;
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

    const subtitle =
      filters.rptType === "1"
        ? "पावती रजिस्टर तपशिल"
        : "पावती रजिस्टर सारांश";

    const html = template({
      logo,
      corporationName, 
      fromDate: formatDate(filters.fromDate),
      toDate: formatDate(filters.toDate),
      zoneName: filters.zoneName || "All",
      rows,
      totalAmount: formatNumber(total),
      currentDate: new Date().toLocaleString("en-IN"),
      subtitle
    });

    // ... puppeteer PDF generation unchanged ...


    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 0 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true
    });

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
  RptReceiptRegisterPDFHelper
};