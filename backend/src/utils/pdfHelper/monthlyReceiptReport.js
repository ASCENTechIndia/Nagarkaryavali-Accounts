const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");

// Convert image to base64
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

// Number to words converter (Indian Rupees format)
const numberToWords = (num) => {
  if (!num || num === 0) return "Zero Only";
  
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

// Format number with commas (Indian format)
const formatIndianNumber = (num) => {
  if (!num && num !== 0) return '0.00';
  return parseFloat(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Calculate totals from tax data
const calculateTotals = (taxData = []) => {
  const totals = {
    cashamt: 0,
    chequeamt: 0,
    ddamt: 0,
    epay: 0,
    card: 0,
    rtgs: 0,
    reambren: 0,
    excessallocation: 0,
    total: 0
  };

  taxData.forEach(item => {
    totals.cashamt += parseFloat(item.cashamt || 0);
    totals.chequeamt += parseFloat(item.chequeamt || 0);
    totals.ddamt += parseFloat(item.ddamt || 0);
    totals.epay += parseFloat(item.epay || 0);
    totals.card += parseFloat(item.card || 0);
    totals.rtgs += parseFloat(item.rtgs || 0);
    totals.reambren += parseFloat(item.reambren || 0);
    totals.excessallocation += parseFloat(item.excessallocation || 0);
    totals.total += parseFloat(item.total || 0);
  });

  return totals;
};

// Calculate summary data (Rebate, Solar Rebate, Access)
const calculateSummaryData = (taxData = []) => {
  const taxTotals = calculateTotals(taxData);
  
  // Get rebate, solar_rebate, and acces from first row (they are same across all rows)
  const firstRow = taxData[0] || {};
  
  const rebate = {
    cashamt: parseFloat(firstRow.cashamt) || 0,
    chequeamt: parseFloat(firstRow.chequeamt) || 0,
    ddamt: parseFloat(firstRow.ddamt) || 0,
    epay: parseFloat(firstRow.epay) || 0,
    card: parseFloat(firstRow.card) || 0,
    rtgs: parseFloat(firstRow.rtgs) || 0,
    total: parseFloat(firstRow.rebate) || 0
  };

  const solarRebate = {
    cashamt: parseFloat(firstRow.cashamt) || 0,
    chequeamt: parseFloat(firstRow.chequeamt) || 0,
    ddamt: parseFloat(firstRow.ddamt) || 0,
    epay: parseFloat(firstRow.epay) || 0,
    card: parseFloat(firstRow.card) || 0,
    rtgs: parseFloat(firstRow.rtgs) || 0,
    total: parseFloat(firstRow.solar_rebate) || 0
  };

  const acces = {
    cashamt: parseFloat(firstRow.cashamt) || 0,
    chequeamt: parseFloat(firstRow.chequeamt) || 0,
    ddamt: parseFloat(firstRow.ddamt) || 0,
    epay: parseFloat(firstRow.epay) || 0,
    card: parseFloat(firstRow.card) || 0,
    rtgs: parseFloat(firstRow.rtgs) || 0,
    total: parseFloat(firstRow.acces) || 0
  };

  const netTotal = {
    cashamt: taxTotals.cashamt + rebate.cashamt + solarRebate.cashamt + acces.cashamt,
    chequeamt: taxTotals.chequeamt + rebate.chequeamt + solarRebate.chequeamt + acces.chequeamt,
    ddamt: taxTotals.ddamt + rebate.ddamt + solarRebate.ddamt + acces.ddamt,
    epay: taxTotals.epay + rebate.epay + solarRebate.epay + acces.epay,
    card: taxTotals.card + rebate.card + solarRebate.card + acces.card,
    rtgs: taxTotals.rtgs + rebate.rtgs + solarRebate.rtgs + acces.rtgs,
    reambren: taxTotals.reambren,
    excessallocation: taxTotals.excessallocation,
    total: taxTotals.total + rebate.total + solarRebate.total + acces.total
  };

  return {
    taxTotals,
    rebate,
    solarRebate,
    acces,
    netTotal
  };
};

// Main PDF generation function
const generateMonthlyTaxwisePDFHelper = async ({
  reportData = [],
  filters = {},
  summary = {},
  metaData = {}
}) => {
  try {
    if (!reportData || reportData.length === 0) {
      throw new Error("No report data provided for PDF generation");
    }

    // Template path
    const templatePath = path.resolve(
      __dirname,
      "../../templates/monthly-receipt-report.html"
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    // Logo
    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    // Register Handlebars helpers
    Handlebars.registerHelper('formatNumber', function(value) {
      if (value === undefined || value === null) return '0.00';
      return formatIndianNumber(value);
    });

    // Format dates
    const formatDateForDisplay = (dateStr) => {
      if (!dateStr) return "";
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (error) {
        return dateStr;
      }
    };

    const fromDate = formatDateForDisplay(filters.fromDate);
    const toDate = formatDateForDisplay(filters.toDate);
    const periodText = `${fromDate} To ${toDate}`;

    // Format tax data for display (add srNo)
    const formattedTaxData = reportData.map((item, index) => ({
      srNo: index + 1,
      tax_name: item.tax_name,
      tax_code: item.tax_code,
      cashamt: parseFloat(item.cashamt || 0),
      chequeamt: parseFloat(item.chequeamt || 0),
      ddamt: parseFloat(item.ddamt || 0),
      epay: parseFloat(item.epay || 0),
      card: parseFloat(item.card || 0),
      rtgs: parseFloat(item.rtgs || 0),
      reambren: parseFloat(item.reambren || 0),
      excessallocation: parseFloat(item.excessallocation || 0),
      total: parseFloat(item.total || 0)
    }));

    // Calculate summary data
    const { taxTotals, rebate, solarRebate, acces, netTotal } = 
      calculateSummaryData(reportData);

    // Generate HTML
    const html = template({
      logo,
      corporationName: metaData.corporationName || "Nashik Municipal Corporation",
      periodText,
      generatedDate: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      taxData: formattedTaxData,
      totals: taxTotals,
      rebate: rebate,
      solar_rebate: solarRebate,
      acces: acces,
      netTotal: netTotal,
      amountInWords: numberToWords(netTotal.total),
      isLastPage: true,
      totalRecords: formattedTaxData.length
    });

    // Puppeteer configuration
    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );

    const launchOptions = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ],
    };

    if (fs.existsSync(chromePath)) {
      launchOptions.executablePath = chromePath;
    }

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    // Set content and wait for it to load
    await page.setContent(html, { 
      waitUntil: "networkidle0", 
      timeout: 60000 
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm"
      },
    });

    await browser.close();

    // Create output directory if it doesn't exist
    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save PDF file
    const timestamp = Date.now();
    const safeFromDate = fromDate.replace(/\//g, '-').replace(/\\/g, '-');
    const safeToDate = toDate.replace(/\//g, '-').replace(/\\/g, '-');
    const fileName = `Monthly_Taxwise_Report_${safeFromDate}_to_${safeToDate}_${timestamp}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    const finalPdf = await PDFDocument.load(pdfBuffer);
    const finalBytes = await finalPdf.save();
    fs.writeFileSync(outputPath, finalBytes);

    console.log(`✅ PDF generated successfully: ${fileName}`);

    return { 
      success: true,
      fileName, 
      outputPath,
      fileSize: finalBytes.length
    };

  } catch (error) {
    console.error("❌ PDF generation error:", error);
    throw error;
  }
};

module.exports = {
  generateMonthlyTaxwisePDFHelper
};