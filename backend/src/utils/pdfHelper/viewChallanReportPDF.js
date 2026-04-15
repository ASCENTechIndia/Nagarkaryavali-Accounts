const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");

const imageToBase64 = (imgPath) => {
  try {
    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    return "";
  }
};

const numberToWords = (num) => {
  if (!num) return "Zero Only";
  
  const numStr = parseFloat(num).toFixed(2);
  const [whole, decimal] = numStr.split('.');
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return tens[ten] + (one ? ' ' + ones[one] : '');
    }
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    return ones[hundred] + ' Hundred' + (rest ? ' ' + convertLessThanThousand(rest) : '');
  };
  
  const convert = (n) => {
    if (n === 0) return 'Zero';
    
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const hundred = Math.floor((n % 1000) / 100);
    const remainder = n % 100;
    
    let result = '';
    if (crore) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (hundred) result += convertLessThanThousand(hundred) + ' Hundred ';
    if (remainder) result += convertLessThanThousand(remainder);
    
    return result.trim();
  };
  
  const wholeNum = parseInt(whole);
  const words = convert(wholeNum);
  const decimalNum = parseInt(decimal);
  
  if (decimalNum > 0) {
    return words + ' and ' + convert(decimalNum) + ' Paise Only';
  }
  
  return words + ' Only';
};

const generateChallanReportPDFHelper = async ({
  reportData = [],
  filters = {},
  summary = {},
  metaData = {}
}) => {
  try {
    if (!reportData || reportData.length === 0) {
      throw new Error("No report data provided");
    }

    const templatePath = path.resolve(__dirname, "../../templates/view-challan-report.html");
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    // Register Handlebars helpers
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('formatNumber', function(value) {
      if (!value) return '0.00';
      return parseFloat(value).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    });

    const formatNumber = (num) => {
      return parseFloat(num || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    // Prepare table rows with formatted numbers
    const tableRows = reportData.map((row, index) => {
      const cash = parseFloat(row.cashamt || 0);
      const cheque = parseFloat(row.chequeamt || 0);
      const dd = parseFloat(row.ddamt || 0);
      const online = parseFloat(row.onlineamount || 0);
      const total = cash + cheque + dd + online;

      return {
        srNo: index + 1,
        tax_name: row.tax_name,
        tax_code: row.tax_code,
        cashamt: formatNumber(cash),
        chequeamt: formatNumber(cheque),
        ddamt: formatNumber(dd),
        onlineamount: formatNumber(online),
        chalan_number: row.chalan_number || '',
        chalan_date: row.chalandate ? new Date(row.chalandate).toLocaleDateString('en-IN') : '',
        total: formatNumber(total),
        isTotalRow: false
      };
    });

    // Calculate colspan based on view mode and report type
    const getColspan = (type) => {
      const { viewOnly, reportType } = filters;
      // if (!viewOnly) {
      if (viewOnly) {
        return reportType === "offline" ? 6 : 5; // SrNo + Tax + Code + 3 cols + Total
      } else {
        return reportType === "offline" ? 8 : 7; // SrNo + Tax + Code + 2 challan cols + 3 cols + Total
      }
    };

    const html = template({
      logo,
      corporationName: metaData.corporationName || "Nashik Municipal Corporation",
      reportType: filters.reportType === "offline" ? "Offline" : "Online",
      viewMode: filters.viewOnly ? "Summary" : "Detailed",
      viewOnly: filters.viewOnly,
      fromDate: new Date(filters.fromDate).toLocaleDateString('en-IN'),
      toDate: new Date(filters.toDate).toLocaleDateString('en-IN'),
      collectionCenterName: filters.collectionCenterName || "All",
      currentDate: new Date().toLocaleDateString('en-IN'),
      rows: tableRows,
      summary: {
        totalCash: formatNumber(summary.totalCash),
        totalCheque: formatNumber(summary.totalCheque),
        totalDD: formatNumber(summary.totalDD),
        totalOnline: formatNumber(summary.totalOnline),
        grandTotal: formatNumber(summary.grandTotal),
        totalExcess: formatNumber(summary.totalExcess),
        totalRebate: formatNumber(summary.totalRebate),
        totalSolar: formatNumber(summary.totalSolar),
        netTotal: formatNumber(summary.netTotal)
      },
      showSummaryRows: true,
      colspanForTotal: getColspan('total'),
      colspanForSummary: getColspan('summary'),
      amountInWords: numberToWords(summary.netTotal)
    });

    console.log("Summary Data :", html)

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
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 0 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "15mm", bottom: "15mm", left: "10mm", right: "10mm" },
    });

    await browser.close();

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = Date.now();
    const reportType = filters.reportType === "offline" ? "Offline" : "Online";
    const viewMode = filters.viewOnly ? "Summary" : "Detailed";
    const fileName = `Challan_Report_${reportType}_${viewMode}_${timestamp}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalPdf = await PDFDocument.load(pdfBuffer);
    const finalBytes = await finalPdf.save();
    fs.writeFileSync(outputPath, finalBytes);

    return { fileName, outputPath };
  } catch (error) {
    console.error("Challan Report PDF generation error:", error);
    throw error;
  }
};

module.exports = {
  generateChallanReportPDFHelper,
};