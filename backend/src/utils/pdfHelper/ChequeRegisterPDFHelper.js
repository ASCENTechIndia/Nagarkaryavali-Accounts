// const fs = require("fs");
// const path = require("path");
// const puppeteer = require("puppeteer");
// const Handlebars = require("handlebars");

// const formatDate = (date) =>
//   date ? new Date(date).toLocaleDateString("en-GB") : "";
// const imageToBase64 = (imgPath) => {
//   try {
//     const file = fs.readFileSync(imgPath);
//     const ext = path.extname(imgPath).replace(".", "");
//     return `data:image/${ext};base64,${file.toString("base64")}`;
//   } catch {
//     return "";
//   }
// };
// const formatNumber = (num) =>
//   Number(num || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

// const ChequeRegisterPDFHelper = async ({ reportData, filters }) => {
//   try {
//     const templatePath = path.resolve(
//       __dirname,
//       "../../templates/RptChequeRegister.html"
//     );

//     const logoPath = path.resolve(__dirname, "../../assets/logo.png");
//     const logo = imageToBase64(logoPath);
//     const templateHtml = fs.readFileSync(templatePath, "utf8");
//     const template = Handlebars.compile(templateHtml);

//     let totalGross = 0;
//     let totalDeduction = 0;
//     let totalNet = 0;
//     let totalCheque = 0;

//     const rows = reportData.map((r) => {
//       totalGross += Number(r.GROSSAMT || 0);
//       totalDeduction += Number(r.TDS || 0);
//       totalNet += Number(r.NETAMOUNT || 0);
//       totalCheque += Number(r.CHEQAMT || 0);

//       return {
//         ...r,
//         CHEQDATE: formatDate(r.CHEQDATE),
//         VCHODATE: formatDate(r.VCHODATE),
//         SYSTEMBILLDATE: formatDate(r.SYSTEMBILLDATE),
//         GROSSAMT: formatNumber(r.GROSSAMT),
//         TDS: formatNumber(r.TDS),
//         NETAMOUNT: formatNumber(r.NETAMOUNT),
//         CHEQAMT: formatNumber(r.CHEQAMT),
//       };
//     });
// const now = new Date();
//   const html = template({
//   logo,
//       corporationName: "मालेगाव महानगरपालिका मालेगाव",
//   fromDate: formatDate(filters.fromDate),
//   toDate: formatDate(filters.toDate),
//   currentDate: formatDate(now),
//   currentTime: now.toLocaleTimeString(),
//   pageInfo: "Page 1 of 1", // later dynamic
//   rows,
//   totalGross,
//   totalDeduction,
//   totalNet,
//   totalCheque
// });

//     const browser = await puppeteer.launch({
//       headless: true,
//       args: ["--no-sandbox"]
//     });

//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: "domcontentloaded" });

//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       printBackground: true
//     });

//     await browser.close();

//     const outputDir = path.resolve(__dirname, "../../../public/pdf");
//     if (!fs.existsSync(outputDir)) {
//       fs.mkdirSync(outputDir, { recursive: true });
//     }

//     const fileName = `Cheque_Register_${Date.now()}.pdf`;
//     const filePath = path.join(outputDir, fileName);

//     fs.writeFileSync(filePath, pdfBuffer);

//     return { fileName, filePath };

//   } catch (err) {
//     console.error(err);
//     throw err;
//   }
// };

// module.exports = { ChequeRegisterPDFHelper };

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

let browserInstance = null;
let browserInitPromise = null;

async function getBrowser() {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }
  
  if (browserInitPromise) {
    return browserInitPromise;
  }
  
  browserInitPromise = puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox", 
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--max_old_space_size=512"
    ]
  }).then(browser => {
    browserInstance = browser;
    browserInitPromise = null;
    return browserInstance;
  }).catch(err => {
    browserInitPromise = null;
    throw err;
  });
  
  return browserInitPromise;
}

const ChequeRegisterPDFHelper = async ({ reportData, ulbInfo, filters }) => {
  let page = null;
  
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/RptChequeRegister.html"
    );

    const logoPath = path.resolve(__dirname, "../../assets/logo.png");
    const logo = imageToBase64(logoPath);
    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const ROWS_PER_PAGE = 8;
    
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
        DEDUCTION: formatNumber(r.TDS),
        NETAMOUNT: formatNumber(r.NETAMOUNT),
        CHEQAMT: formatNumber(r.CHEQAMT),
        CHEQRELIDATE: r.CHEQRELIDATE ? formatDate(r.CHEQRELIDATE) : "",
      };
    });

    const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);
    const now = new Date();
    
    const pages = [];
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const startIdx = (pageNum - 1) * ROWS_PER_PAGE;
      const endIdx = Math.min(startIdx + ROWS_PER_PAGE, rows.length);
      const pageRows = rows.slice(startIdx, endIdx);
      
      let runningGross = 0;
      let runningDeduction = 0;
      let runningNet = 0;
      let runningCheque = 0;
      
      for (let i = 0; i < endIdx; i++) {
        runningGross += Number(reportData[i].GROSSAMT || 0);
        runningDeduction += Number(reportData[i].TDS || 0);
        runningNet += Number(reportData[i].NETAMOUNT || 0);
        runningCheque += Number(reportData[i].CHEQAMT || 0);
      }
      
      pages.push({
        pageNumber: pageNum,
        totalPages: totalPages,
        rows: pageRows,
        isLastPage: (pageNum === totalPages),
        totalGross: formatNumber(runningGross),
        totalDeduction: formatNumber(runningDeduction),
        totalNet: formatNumber(runningNet),
        totalCheque: formatNumber(runningCheque)
      });
    }
    
    const html = template({
      logo: ulbInfo.ULBLOGO,
      corporationName: ulbInfo.ABC_MUNICIPAL_TEXT,
      fromDate: formatDate(filters.fromDate),
      toDate: formatDate(filters.toDate),
      currentDate: formatDate(now),
      currentTime: now.toLocaleTimeString(),
      pages: pages,
      accountNumber: filters.minorCode || "ALL",
      bankName:filters.majorCode ?? "ALL"
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
    
    await page.setContent(html, { 
      waitUntil: "domcontentloaded", 
      timeout: 30000 
    });
    
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "8mm",
        bottom: "8mm",
        left: "8mm",
        right: "8mm"
      },
      timeout: 30000
    });
    
    await page.close();
    page = null;

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `Cheque_Register_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };

  } catch (err) {
    console.error("PDF Generation Error:", err);
    
    if (page) {
      try {
        await page.close();
      } catch (closeErr) {
        console.error("Error closing page:", closeErr);
      }
    }
    
    throw err;
  }
};

process.on('exit', async () => {
  if (browserInstance) {
    await browserInstance.close();
  }
});

module.exports = { ChequeRegisterPDFHelper };