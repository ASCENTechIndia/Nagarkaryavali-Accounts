const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

// ================= IMAGE BASE64 =================
const imageToBase64 = (imgPath) => {
  try {
    if (!imgPath) return "";

    // already base64
    if (imgPath.startsWith("data:image")) return imgPath;

    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch {
    return "";
  }
};

// ================= FORMAT =================
const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB");
};

// ================= MAIN =================
const generateChequeBookPDF = async ({ data, filters, corporationName, corporationLogo }) => {
  try {
    const templatePath = path.resolve(__dirname, "../../templates/FrmChequeBook.html");

    const htmlTemplate = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlTemplate);

    // ✅ header dynamic text
    const headerText = `धनादेश : ${filters.chequeFrom} पासून ${filters.chequeTo} पर्यंत. बँक जी.एल.:${filters.majorCode} बँक खाते:${filters.bankAcc}`;

    // ✅ logo
    const logo = imageToBase64(corporationLogo);

    const rows = data.map((row) => ({
      chqbookno: row.CHQBOOKNO,
      chqno: row.CHQNO,
      trnsno: row.TRNSNO,
      trnsdate: formatDate(row.TRNSDATE),
      trnstype: row.TRNSTYPE,
      docno: row.DOCNO,
      chqdate: formatDate(row.CHQDATE),
      zone: row.ZONE,
      amount: `${row.CRDR || ""} ${row.AMOUNT || ""}`,
      major: row.FUNCTIONCODE,
      minor: row.OBJECTCODE,
      minorname: row.ACCNAME,
      party: row.PARTYNAME,
    }));

    const html = template({
      rows,
      headerText,
      logo,
      corporationName,
    });

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    const fileName = `ChequeBook_${Date.now()}.pdf`;
    const filePath = path.resolve("public/pdf", fileName);

    await page.pdf({
      path: filePath,
      format: "A4",
      landscape: true,
      printBackground: true,

      displayHeaderFooter: true,

      margin: {
        top: "120px", // increase for header space
        bottom: "80px",
        left: "20px",
        right: "20px",
      },

      headerTemplate: `
    <div style="width:100%;padding:5px 20px;font-size:10px;">

      <div style="display:flex;align-items:center;">
        <img src="${logo}" style="width:70px;" />
        <div style="flex:1;text-align:center;font-size:14px;font-weight:bold;">
          ${corporationName}
        </div>
      </div>

      <div style="text-align:center;font-size:12px;margin-top:2px;">
        धनादेश पुस्तक तपशील
      </div>

      <div style="text-align:center;font-size:11px;margin-top:2px;">
        ${headerText}
      </div>

      <div style="border-top:1px solid black;margin-top:5px;"></div>
    </div>
  `,

      footerTemplate: `
    <div style="
      width:100%;
      font-size:10px;
      padding:0 20px;
      display:flex;
      justify-content:space-between;
    ">
      <div>
        दिनांक : ${new Date().toLocaleDateString("en-GB")}
        &nbsp;&nbsp;
        वेळ : ${new Date().toLocaleTimeString()}
      </div>

      <div>
        प्रष्ट :
        <span class="pageNumber"></span> /
        <span class="totalPages"></span>
      </div>
    </div>
  `,
    });

    await browser.close();

    return { fileName, filePath };
  } catch (err) {
    console.error("PDF ERROR:", err);
    throw err;
  }
};

module.exports = { generateChequeBookPDF };
