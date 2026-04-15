// const fs = require("fs");
// const path = require("path");
// const puppeteer = require("puppeteer");
// const Handlebars = require("handlebars");

// const imageToBase64 = (imgPath) => {
//   const file = fs.readFileSync(imgPath);
//   const ext = path.extname(imgPath).replace(".", "");
//   return `data:image/${ext};base64,${file.toString("base64")}`;
// };

// const generateTopDemandPDF = async ({
//   demandList,
//   zoneName,
//   printDate,
//   corporationName
// }) => {

//   const templatePath = path.join(
//     __dirname,
//     "../../templates/TopDemandReport.html"
//   );

//   const htmlTemplate = fs.readFileSync(templatePath, "utf8");
//   const template = Handlebars.compile(htmlTemplate);

//   const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
//   const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

//   // ✅ FORMAT DATE SAFELY
//   const safeDate = printDate instanceof Date
//     ? printDate
//     : new Date();

//   const formattedDate =
//     safeDate.getDate().toString().padStart(2, "0") + "/" +
//     (safeDate.getMonth() + 1).toString().padStart(2, "0") + "/" +
//     safeDate.getFullYear();

//   // ✅ FORMAT LIST + CALCULATE TOTAL SAFELY
//   let grandTotal = 0;

//   const formattedList = demandList.map((row, index) => {

//     // Remove commas if any & convert safely
//     const cleanValue = String(row.demand ?? 0)
//       .replace(/,/g, "")
//       .trim();

//     const numericValue = parseFloat(cleanValue) ?? 0;

//     grandTotal += numericValue;

//     return {
//       srNo: index + 1,
//       indexno: row.indexno ?? "",
//       ownername: row.ownername ?? "",
//       address: row.address ?? "",
//       wardname: row.wardname ?? "",
//       demand: numericValue.toLocaleString("en-IN")
//     };
//   });

// const html = template({
//   demandList: formattedList,
//   logo,
//   zoneName: zoneName ?? "All Zones",
//   corporationName,
//   printDate: formattedDate,
//   grandTotal: grandTotal.toLocaleString("en-IN"),
//   totalCount: formattedList.length
// });

//   const browser = await puppeteer.launch({
//     headless: true,
//     args: ["--no-sandbox", "--disable-setuid-sandbox"],
//   });

//   const page = await browser.newPage();
//   await page.setContent(html, { waitUntil: "networkidle0", timeout:60000 });

//   const pdfBuffer = await page.pdf({
//     format: "A4",
//     printBackground: true,
//     margin: { top: "10mm", bottom: "10mm" },
//   });

//   await browser.close();

//   const fileName = `Top100Demand_${Date.now()}.pdf`;
//   const outputPath = path.join(__dirname, "../../../public/pdf", fileName);

//   fs.writeFileSync(outputPath, pdfBuffer);

//   return { fileName, outputPath };
// };

// module.exports = generateTopDemandPDF;


const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

/* ----------------------------------------------------------
   Safe Image To Base64
---------------------------------------------------------- */
const imageToBase64 = (imgPath) => {
  try {
    if (!fs.existsSync(imgPath)) return "";
    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch (error) {
    console.error("Image conversion error:", error);
    return "";
  }
};

/* ----------------------------------------------------------
   Generate Top Demand PDF
---------------------------------------------------------- */
const generateTopDemandPDF = async ({
  demandList = [],
  zoneName,
  printDate,
  corporationName,
}) => {
  try {
    /* ---------- Validate Input ---------- */
    if (!Array.isArray(demandList)) {
      throw new Error("Invalid demand list data");
    }

    /* ---------- Template Path ---------- */
    const templatePath = path.resolve(
      __dirname,
      "../../templates/TopDemandReport.html"
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const htmlTemplate = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlTemplate);

    /* ---------- Logo ---------- */
    const logoPath = path.resolve(
      __dirname,
      "../../assets/NMC_Logo.jpeg"
    );
    const logo = imageToBase64(logoPath);

    /* ---------- Safe Date Formatting ---------- */
    const safeDate =
      printDate instanceof Date ? printDate : new Date();

    const formattedDate =
      safeDate.getDate().toString().padStart(2, "0") +
      "/" +
      (safeDate.getMonth() + 1).toString().padStart(2, "0") +
      "/" +
      safeDate.getFullYear();

    /* ---------- Format List + Calculate Total ---------- */
    let grandTotal = 0;

    const formattedList = demandList.map((row, index) => {
      const cleanValue = String(row?.demand ?? 0)
        .replace(/,/g, "")
        .trim();

      const numericValue = parseFloat(cleanValue) ?? 0;
      grandTotal += numericValue;

      return {
        srNo: index + 1,
        indexno: row?.indexno ?? "",
        ownername: row?.ownername ?? "",
        address: row?.address ?? "",
        wardname: row?.wardname ?? "",
        zoneName: row.zonename ?? "-",
        demand: numericValue.toLocaleString("en-IN"),
      };
    });

    /* ---------- Generate HTML ---------- */
    const html = template({
      demandList: formattedList,
      logo,
      zoneName: zoneName || "All Zones",
      corporationName:
      corporationName ?? "Nashik Municipal Corporation",
      printDate: formattedDate,
      grandTotal: grandTotal.toLocaleString("en-IN"),
      totalCount: formattedList.length,
    });

    console.log("Top Demand HTML length:", html.length);

    /* ----------------------------------------------------------
       Launch Puppeteer (MATCH YOUR WORKING SERVER CONFIG)
    ---------------------------------------------------------- */

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

    /* ---------- IMPORTANT FIX ---------- */
    await page.setContent(html, {
      waitUntil: "load", // changed from networkidle0
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm" },
    });

    await browser.close();

    /* ---------- Save PDF ---------- */
    const outputDir = path.resolve(
      __dirname,
      "../../../public/pdf"
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `Top100Demand_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    fs.writeFileSync(outputPath, pdfBuffer);

    console.log("Top Demand PDF Generated:", fileName);

    return { fileName, outputPath };

  } catch (error) {
    console.error("Top Demand PDF Error:", error);
    throw error;
  }
};

module.exports = generateTopDemandPDF;