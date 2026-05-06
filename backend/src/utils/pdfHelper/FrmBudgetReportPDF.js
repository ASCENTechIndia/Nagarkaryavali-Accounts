const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

// ================= FORMAT NUMBER =================
// No commas (as per your requirement)
const formatNumber = (num) => {
  if (num === null || num === undefined) return "";
  return Math.round(Number(num)).toString();
};

// ================= BUILD ROWS (ORDER SAFE) =================
const buildRows = (data) => {
  let rows = [];

  let prevG1 = null;
  let prevG2 = null;
  let prevG3 = null;
  let prevG4 = null;

  data.forEach((row) => {
    // G1
    if (prevG1 !== row.G1NAME) {
      rows.push({ isG1: true, name: row.G1NAME });
      prevG1 = row.G1NAME;
      prevG2 = prevG3 = prevG4 = null;
    }

    // G2
    if (prevG2 !== row.G2NAME) {
      rows.push({ isG2: true, name: row.G2NAME });
      prevG2 = row.G2NAME;
      prevG3 = prevG4 = null;
    }

    // G3
    if (prevG3 !== row.G3NAME) {
      rows.push({ isG3: true, name: row.G3NAME });
      prevG3 = row.G3NAME;
      prevG4 = null;
    }

    // G4 (use GLFUNCTION here)
    if (prevG4 !== row.G4) {
      rows.push({
        isG4: true,
        glfunction: row.GLFUNCTION,
        name: row.G4NAME,
      });
      prevG4 = row.G4;
    }

    // ACCOUNT ROW
    rows.push({
      isAcc: true,
      accno: row.ACCNO,
      accname: row.ACCNAME,
      glcode: row.GLCODE,
      glname: row.GLNAME,
      budget: formatNumber(row.BUDGETAMT),
      revised: formatNumber(row.REVBUDGETAMT),
      actual: formatNumber(row.CURRBAL),
      percent: "0.00",
    });
  });

  return rows;
};

// ================= MAIN FUNCTION =================
const generateBudgetPDF = async ({ data }) => {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/FrmBudgetReport.html"
    );

    const htmlTemplate = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlTemplate);

    const rows = buildRows(data);

    console.log("Rows count:", rows.length);

    const html = template({
      rows,
      printDate: new Date().toLocaleString("en-GB"),
    });

    // const browser = await getBrowser();
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

    await page.setContent(html, { waitUntil: "networkidle0" });

    const fileName = `BudgetReport_${Date.now()}.pdf`;
    const filePath = path.resolve("public/pdf", fileName);

    await page.pdf({
      path: filePath,
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "60px",
        bottom: "60px",
        left: "20px",
        right: "20px",
      },
    });

    await browser.close();

    return { fileName, filePath };
  } catch (err) {
    console.error("PDF ERROR:", err);
    throw err;
  }
};

module.exports = { generateBudgetPDF };