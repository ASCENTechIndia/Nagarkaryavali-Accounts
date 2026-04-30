const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

const imageToBase64 = (imgPath) => {
  try {
    if (!imgPath) return "";
    if (imgPath.startsWith("data:image")) return imgPath;
    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch {
    return "";
  }
};

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatIndianDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' });
};

Handlebars.registerHelper('formatDate', function(date) {
  return formatDate(date);
});

Handlebars.registerHelper('formatIndianDate', function(date) {
  return formatIndianDate(date);
});

Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

Handlebars.registerHelper('add', function(a, b) {
  return a + b;
});

Handlebars.registerHelper('formatNumber', function(number) {
  if (!number && number !== 0) return '0';
  return number.toString();
});

Handlebars.registerHelper('formatAmount', function(amount) {
  if (!amount && amount !== 0) return '0';
  return amount.toString();
});

const batchSize = 10;

const batchDataIntoPages = (data, batchSize) => {
  const pages = [];
  if (!data || data.length === 0) {
    return [{ rows: [], pageNumber: 1, totalPages: 1 }];
  }
  for (let i = 0; i < data.length; i += batchSize) {
    pages.push({
      rows: data.slice(i, i + batchSize),
      pageNumber: Math.floor(i / batchSize) + 1,
      totalPages: Math.ceil(data.length / batchSize)
    });
  }
  return pages;
};

const formatReportData = (data, reportType) => {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map((row, index) => ({
    slNo: index + 1,
    partyId: row.PARTYID || "",
    partyName: row.PARTYNAME || "",
    depositNo: row.DEPONO || "",
    panCard: row.PANCARD || "",
    bankAccNo: row.BANKACCNO || "",
    propName: row.PROPNAME || "",
    depoDetail: row.DEPODETAIL || "",
    major: row.GLCODE || "",
    majorName: row.GLNAME || "",
    transNo: row.RECTRANSNO || "",
    minorName: row.ACCNAME || "",
    receivedDate: row.RECTRANSDATE || "",
    partyTransNo: row.PAYTRNSNO || "",
    amount: row.AMOUNT || 0,
    zone: row.DEPTNAME || "",
    partyTransDate: row.PAYTRANSDATE || "",
    depositType: row.DEPOSITTYPE || "",
    functionCode: row.FUNCTIONCODE || "",

    // For Report 147 specific fields
    apr: row.APR || 0,
    may: row.MAY || 0,
    jun: row.JUN || 0,
    jul: row.JUL || 0,
    aug: row.AUG || 0,
    sep: row.SEP || 0,
    oct: row.OCT || 0,
    nov: row.NOV || 0,
    dec: row.DECM || 0,
    jan: row.JAN || 0,
    feb: row.FEB || 0,
    mar: row.MAR || 0,
    total: row.TOTAL || 0,
    trnsApr: row.TRNSAPR || "",
    trnsMay: row.TRNSMAY || "",
    trnsJun: row.TRNSJUN || "",
    trnsJul: row.TRNSJUL || "",
    trnsAug: row.TRNSAUG || "",
    trnsSep: row.TRNSSEP || "",
    trnsOct: row.TRNSOCT || "",
    trnsNov: row.TRNSNOV || "",
    trnsDec: row.TRNSDECM || "",
    trnsJan: row.TRNSJAN || "",
    trnsFeb: row.TRNSFEB || "",
    trnsMar: row.TRNSMAR || "",
    certino: row.CERTINO || "",
    sddt: row.SDDT || ""
  }));
};

const getReportTitle = (reportType) => {
  switch(reportType) {
    case 'depReceived':
      return 'ठेव प्राप्त';
    case 'depoPayment':
      return 'ठेव देयक';
    case 'unpaid':
      return 'ठेव बाकी';
    case 'report147':
      return 'अहवाल 147';
    default:
      return 'सुरक्षा ठेव अहवाल';
  }
};

const getReportSubtitle = (reportType, filters) => {
  const fromDate = filters.fromDate || '';
  const toDate = filters.toDate || '';
  
  switch(reportType) {
    case 'depReceived':
      return `${fromDate} ते ${toDate}`;
    case 'depoPayment':
      return ` ${fromDate} ते ${toDate}`;
    case 'unpaid':
      return `${fromDate} ते ${toDate}`;
    case 'report147':
      return `${fromDate} ते ${toDate}`;
    default:
      return `${fromDate} ते ${toDate}`;
  }
};

const generateSecurityDepositPDF = async ({ data, filters, reportType, corporationName, corporationLogo }) => {
  try {
    const templatePath = path.resolve(__dirname, "../../templates/FrmSecurityDeposit.html");

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const htmlTemplate = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlTemplate);

    const reportTitle = getReportTitle(reportType);
    const reportSubtitle = getReportSubtitle(reportType, filters);
    const zoneText = filters.zoneId && filters.zoneId !== '-1' ? `झोन: ${filters.zoneName || filters.zoneId}` : 'सर्व झोन';

    const logo = imageToBase64(corporationLogo);

    const formattedRows = formatReportData(data, reportType);
    
    const pages = batchDataIntoPages(formattedRows, batchSize);

    const now = new Date();
    const currentDate = now.toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' });
    const currentTime = now.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });

    const totalAmount = formattedRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
    const totalRecords = formattedRows.length;

    const html = template({
      pages,
      reportTitle,
      reportSubtitle,
      zoneText,
      logo,
      corporationName: corporationName || "",
      currentDate,
      currentTime,
      totalAmount,
      totalRecords,
      reportType
    });

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
      waitUntil: "networkidle0",
      timeout: 0,
    });

    const outputDir = path.resolve(__dirname, "../../../public/pdf");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = Date.now();
    const fileName = `SecurityDeposit_${reportType}_${timestamp}.pdf`;
    const filePath = path.join(outputDir, fileName);

    await page.pdf({
      path: filePath,
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "140px",
        bottom: "60px",
        left: "20px",
        right: "20px",
      },
    });

    await page.close();
    await browser.close();

    return {
      fileName,
      filePath,
    };
  } catch (err) {
    console.error("PDF Generation Error:", err);
    throw err;
  }
};

module.exports = { generateSecurityDepositPDF };