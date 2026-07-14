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

    // let totalAmount = 0;
    // let sutRakkam = 0;

    // const rows = reportData.map((row) => {
    //   const amt = Number(row.AMOUNT || 0);

    //   totalAmount += amt;

    //   // ACCNO for Discount Amount
    //   if (String(row.ACCNO) === "91028290003") {
    //     sutRakkam += amt;
    //   }

    //   return {
    //     TRNSDATE: formatDate(row.TRNSDATE),
    //     TRANSNO: row.TRANSNO,
    //     DOCNO: row.DOCNO,
    //     ACCNO: row.ACCNO,
    //     ACCNAME: row.ACCNAME,
    //     NARRATION: row.NARRATION,
    //     PARTYNAME: row.PARTYNAME || "",
    //     AMOUNT: formatNumber(amt)
    //   };
    // });

    let grandTotal = 0;
    let sutRakkam = 0;

    const departmentMap = {};

    reportData.forEach((row) => {
      const deptName = row.DEPTNAME || "Unknown Department";
      const amount = Number(row.AMOUNT || 0);

      grandTotal += amount;

      if (String(row.ACCNO) === "91028290003") {
        sutRakkam += amount;
      }

      if (!departmentMap[deptName]) {
        departmentMap[deptName] = {
          deptName,
          total: 0,
          rows: [],
        };
      }

      departmentMap[deptName].rows.push({
        TRNSDATE: formatDate(row.TRNSDATE),
        GLCODE: row.GLCODE,
        ACCNO: row.ACCNO,
        ACCNAME: row.ACCNAME,
        DEPTNAME: deptName,
        AMOUNT: formatNumber(amount),
        TRANSNO: row.TRANSNO,
        DOCNO: row.DOCNO,
        NARRATION: row.NARRATION,
        PARTYNAME: row.PARTYNAME || "",
      });

      departmentMap[deptName].total += amount;
    });

    const departments = Object.values(departmentMap).map((d) => ({
      deptName: d.deptName,
      rows: d.rows,
      total: formatNumber(d.total),
    }));

    const departmentSummary = Object.values(departmentMap).map((d) => ({
      deptName: d.deptName,
      total: formatNumber(d.total),
    }));

    const netCollectedAmount = grandTotal - sutRakkam;

    // const netCollectedAmount = totalAmount - sutRakkam;

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
      // rows,
      departments,
      departmentSummary,

      totalAmount: formatNumber(grandTotal),
      sutRakkam: formatNumber(sutRakkam),
      netCollectedAmount: formatNumber(netCollectedAmount),
      isDetail: filters.rptType === "1",

      currentDate: new Date().toLocaleString("en-IN"),
      subtitle
    });

    // ... puppeteer PDF generation unchanged ...


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
      printBackground: true
    });

    await page.close();
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