const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

// =======================
// FORMATTERS
// =======================
const formatDate = (date) => {
  if (!date) return "";

  let d;

  if (typeof date === "string" && date.includes("-")) {
    const [day, month, year] = date.split("-");
    d = new Date(`${year}-${month}-${day}`);
  } else {
    d = new Date(date);
  }

  if (isNaN(d)) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

const formatNumber = (num) => {
  return Number(num || 0).toLocaleString("en-IN");
};

// =======================
// MAIN HELPER
// =======================
const PaymentRegisterPDFHelper = async ({
  reportData,
  filters,
  corporationName,
  corporationLogo,
}) => {
  try {
    let { fromDate, toDate } = filters || {};

    fromDate = formatDate(fromDate);
    toDate = formatDate(toDate);

    if (!reportData || !reportData.length) {
      throw new Error("No data found for PDF");
    }

    // =======================
    // PREPARE DATA
    // =======================
    let totalAmount = 0;

    const formattedData = reportData.map((row, index) => {
      const amt = Number(Math.abs(row.AMOUNT) || 0);
      totalAmount += amt;
      console.log("row",row)
      return {
        srNo: index + 1,
        date: formatDate(row.TRNSDATE),
        transNo: row.TRANSNO,
        docNo: row.DOCNO,
        glName: row.GLNAME,
        accName: row.ACCNAME,
        zone: row.DEPTNAME,
        amount: row.AMOUNT,
        narration: row.NARRATION,
        party: row.PARTYNAME ?? "-",
      };
    });

    // =======================
    // LOAD TEMPLATE
    // =======================
    const templatePath = path.resolve(
      __dirname,
      "../../templates/PaymentRegister.html"
    );

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const html = template({
      corporationName,
      corporationLogo,
      fromDate,
      toDate,
      data: formattedData,
      totalAmount: formatNumber(totalAmount),
    });

    // =======================
    // GENERATE PDF
    // =======================
    // const browser = await puppeteer.launch({
    //   headless: true,
    //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
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

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true, // better for wide table
      printBackground: true,
      displayHeaderFooter: true,
      // headerTemplate: `
      //   <div style="font-family: Arial; font-size: 9px; width: 100%; margin: 0 20px;">
      //     <div style="display:flex; justify-content:space-between;">
      //       <div style="font-size:12px">${corporationName}</div>
      //       <div style="font-weight:bold; font-size:14px;">
      //         Payment Register / पेमेंट रजिस्टर
      //       </div>
      //       <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
      //     </div>
      //     <div style="text-align:right;">${fromDate} To ${toDate}</div>
      //   </div>
      // `,
      // footerTemplate: `<div></div>`,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    });

    await page.close();
    await browser.close();

    // =======================
    // SAVE FILE
    // =======================
    const outputDir = path.resolve(__dirname, "../../../public/pdf");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `RptPaymentRegister_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return {
      fileName,
      filePath,
    };
  } catch (error) {
    console.error("Payment Register PDF Error:", error);
    throw error;
  }
};

module.exports = {
  PaymentRegisterPDFHelper,
};